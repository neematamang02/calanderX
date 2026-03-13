import { prisma } from "@/utils/prisma";
import { OAuthService } from "@/services/oauth.service";

/**
 * Service wrapper for automatic OAuth token refresh
 * Handles token expiration transparently before making API calls
 */
export class TokenRefreshService {
  /**
   * Execute API call with automatic token refresh
   */
  static async executeWithTokenRefresh<T>(
    connectedAccountId: string,
    apiCall: (accessToken: string) => Promise<T>
  ): Promise<T> {
    const account = await prisma.connectedAccount.findUnique({
      where: { id: connectedAccountId },
    });

    if (!account) {
      throw new Error('Connected account not found');
    }

    let accessToken = account.accessToken;

    // Check if token is expired or will expire in the next 5 minutes
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (account.tokenExpiresAt && account.tokenExpiresAt <= fiveMinutesFromNow) {
      console.log(`Token for account ${connectedAccountId} is expired or expiring soon, refreshing...`);
      
      try {
        // Refresh the token
        await OAuthService.refreshAccessToken(connectedAccountId);
        
        // Get the updated token
        const updatedAccount = await prisma.connectedAccount.findUnique({
          where: { id: connectedAccountId },
        });
        
        if (updatedAccount) {
          accessToken = updatedAccount.accessToken;
          console.log(`Token refreshed successfully for account ${connectedAccountId}`);
        }
      } catch (error) {
        console.error(`Failed to refresh token for account ${connectedAccountId}:`, error);
        // Continue with existing token - the API call might still work
      }
    }

    try {
      // Execute the API call
      return await apiCall(accessToken);
    } catch (error) {
      // If API call fails with 401, try refreshing token once more
      if (this.isUnauthorizedError(error)) {
        console.log(`API call failed with 401, attempting token refresh for account ${connectedAccountId}`);
        
        try {
          await OAuthService.refreshAccessToken(connectedAccountId);
          
          // Get the updated token
          const updatedAccount = await prisma.connectedAccount.findUnique({
            where: { id: connectedAccountId },
          });
          
          if (updatedAccount) {
            // Retry the API call with new token
            return await apiCall(updatedAccount.accessToken);
          }
        } catch (refreshError) {
          console.error(`Token refresh failed for account ${connectedAccountId}:`, refreshError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Check if error is an unauthorized error (401)
   */
  private static isUnauthorizedError(error: any): boolean {
    return (
      error?.response?.status === 401 ||
      error?.status === 401 ||
      (typeof error === 'object' && error?.message?.includes('401')) ||
      (typeof error === 'object' && error?.message?.toLowerCase().includes('unauthorized'))
    );
  }

  /**
   * Batch execute multiple API calls with token refresh
   */
  static async executeBatchWithTokenRefresh<T>(
    operations: Array<{
      connectedAccountId: string;
      apiCall: (accessToken: string) => Promise<T>;
    }>
  ): Promise<Array<{ success: boolean; data?: T; error?: string }>> {
    const results = await Promise.allSettled(
      operations.map(op => 
        this.executeWithTokenRefresh(op.connectedAccountId, op.apiCall)
      )
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return { success: true, data: result.value };
      } else {
        return { 
          success: false, 
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
      }
    });
  }
}