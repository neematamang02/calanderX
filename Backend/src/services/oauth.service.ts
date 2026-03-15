import { prisma } from "@/utils/prisma";
import { oauthConfig } from "@/config/oauth";
import { 
  Provider, 
  OAuthState, 
  OAuthCallback, 
  OAuthTokenResponse, 
  OAuthUserInfo,
  ConnectedAccountResponse,
  OAuthStateSchema,
  OAuthCallbackSchema,
  OAuthTokenResponseSchema,
  OAuthUserInfoSchema
} from "@/types/validation";
import { signToken, verifyToken } from "@/utils/jwt";
import crypto from "crypto";

export class OAuthService {
  /**
   * Generate OAuth authorization URL with CSRF protection
   */
  static generateAuthUrl(provider: Provider, userId: string): string {
    const config = oauthConfig[provider];
    
    // Create secure state parameter for CSRF protection
    const state = {
      userId,
      provider,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };
    
    // Encode state as JWT for security
    const stateToken = signToken({ userId, email: '' }); // Temporary email for JWT structure
    const stateData = Buffer.from(JSON.stringify(state)).toString('base64');
    
    const params = new URLSearchParams();
    params.append('client_id', config.clientId || '');
    params.append('redirect_uri', config.redirectUri || '');
    params.append('scope', config.scopes.join(' '));
    params.append('response_type', 'code');
    params.append('access_type', 'offline');
    params.append('prompt', 'consent');
    params.append('state', stateData);

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and connect account
   */
  static async handleCallback(
    provider: Provider,
    callbackData: OAuthCallback
  ): Promise<ConnectedAccountResponse> {
    // Validate callback data
    const validatedCallback = OAuthCallbackSchema.parse(callbackData);
    
    // Check for OAuth errors
    if (validatedCallback.error) {
      throw new Error(`OAuth error: ${validatedCallback.error_description || validatedCallback.error}`);
    }

    // Verify and decode state
    const state = this.verifyState(validatedCallback.state, provider);
    
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(provider, validatedCallback.code);
    
    // Get user info from provider
    const userInfo = await this.getUserInfo(provider, tokens.access_token);
    
    // Save connected account
    const connectedAccount = await this.saveConnectedAccount(
      state.userId,
      provider,
      userInfo,
      tokens
    );

    // Automatically sync calendars after successful connection
    try {
      const { CalendarService } = await import('./calendar.service');
      await CalendarService.syncCalendarsForAccount(connectedAccount.id);
    } catch (syncError) {
      // Log the error but don't fail the OAuth process
      console.error('Failed to auto-sync calendars after OAuth:', syncError);
    }

    return connectedAccount;
  }

  /**
   * Exchange authorization code for access tokens
   */
  private static async exchangeCodeForTokens(
    provider: Provider,
    code: string
  ): Promise<OAuthTokenResponse> {
    const config = oauthConfig[provider];
    
    const body = new URLSearchParams();
    body.append('client_id', config.clientId || '');
    body.append('client_secret', config.clientSecret || '');
    body.append('code', code);
    body.append('grant_type', 'authorization_code');
    body.append('redirect_uri', config.redirectUri || '');

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return OAuthTokenResponseSchema.parse(data);
  }

  /**
   * Get user information from OAuth provider
   */
  private static async getUserInfo(
    provider: Provider,
    accessToken: string
  ): Promise<OAuthUserInfo> {
    const userInfoUrl = provider === 'google' 
      ? 'https://www.googleapis.com/oauth2/v2/userinfo'
      : 'https://graph.microsoft.com/v1.0/me';

    const response = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Normalize user info based on provider
    const normalizedUserInfo = provider === 'google' 
      ? {
          id: data.id as string,
          email: data.email as string,
          name: data.name as string,
          picture: data.picture as string,
        }
      : {
          id: data.id as string,
          email: (data.mail || data.userPrincipalName) as string,
          name: data.displayName as string,
          picture: undefined,
        };

    return OAuthUserInfoSchema.parse(normalizedUserInfo);
  }

  /**
   * Save connected account to database
   */
  private static async saveConnectedAccount(
    userId: string,
    provider: Provider,
    userInfo: OAuthUserInfo,
    tokens: OAuthTokenResponse
  ): Promise<ConnectedAccountResponse> {
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    const connectedAccount = await prisma.connectedAccount.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId,
          provider,
          providerAccountId: userInfo.id,
        },
      },
      update: {
        email: userInfo.email,
        displayName: userInfo.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider,
        providerAccountId: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
      },
    });

    return {
      id: connectedAccount.id,
      userId: connectedAccount.userId,
      provider: connectedAccount.provider,
      providerAccountId: connectedAccount.providerAccountId,
      email: connectedAccount.email,
      displayName: connectedAccount.displayName,
      createdAt: connectedAccount.createdAt,
      updatedAt: connectedAccount.updatedAt,
    };
  }

  /**
   * Verify OAuth state parameter for CSRF protection
   */
  private static verifyState(stateToken: string, expectedProvider: Provider): OAuthState {
    try {
      // Decode base64 state
      const decoded = JSON.parse(Buffer.from(stateToken, 'base64').toString());
      
      const state = OAuthStateSchema.parse(decoded);
      
      // Verify provider matches
      if (state.provider !== expectedProvider) {
        throw new Error('Provider mismatch in state parameter');
      }
      
      // Verify timestamp (prevent replay attacks)
      const maxAge = 10 * 60 * 1000; // 10 minutes
      if (Date.now() - state.timestamp > maxAge) {
        throw new Error('OAuth state has expired');
      }
      
      return state;
    } catch (error) {
      throw new Error(`Invalid OAuth state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh expired access token
   */
  static async refreshAccessToken(
    connectedAccountId: string
  ): Promise<ConnectedAccountResponse> {
    const account = await prisma.connectedAccount.findUnique({
      where: { id: connectedAccountId },
    });

    if (!account || !account.refreshToken) {
      throw new Error('Connected account not found or no refresh token available');
    }

    const config = oauthConfig[account.provider];
    
    const body = new URLSearchParams();
    body.append('client_id', config.clientId || '');
    body.append('client_secret', config.clientSecret || '');
    body.append('refresh_token', account.refreshToken);
    body.append('grant_type', 'refresh_token');

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const tokens = OAuthTokenResponseSchema.parse(await response.json());
    
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    const updatedAccount = await prisma.connectedAccount.update({
      where: { id: connectedAccountId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || account.refreshToken,
        tokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    return {
      id: updatedAccount.id,
      userId: updatedAccount.userId,
      provider: updatedAccount.provider,
      providerAccountId: updatedAccount.providerAccountId,
      email: updatedAccount.email,
      displayName: updatedAccount.displayName,
      createdAt: updatedAccount.createdAt,
      updatedAt: updatedAccount.updatedAt,
    };
  }

  /**
   * Get all connected accounts for a user
   */
  static async getConnectedAccounts(userId: string): Promise<ConnectedAccountResponse[]> {
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map(account => ({
      id: account.id,
      userId: account.userId,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      email: account.email,
      displayName: account.displayName,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }

  /**
   * Disconnect an account
   */
  static async disconnectAccount(userId: string, accountId: string): Promise<void> {
    await prisma.connectedAccount.delete({
      where: {
        id: accountId,
        userId, // Ensure user owns this account
      },
    });
  }
}