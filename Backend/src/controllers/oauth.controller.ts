import { Request, Response } from "express";
import { OAuthService } from "@/services/oauth.service";
import { ProviderSchema, OAuthCallbackSchema } from "@/types/validation";
import { JwtPayload } from "@/utils/jwt";

// Extend Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export class OAuthController {
  /**
   * Initiate OAuth flow - redirect user to provider
   */
  static async initiateOAuth(req: Request, res: Response): Promise<void> {
    try {
      const provider = req.params.provider as string;
      
      // Validate provider
      const validatedProvider = ProviderSchema.parse(provider);
      
      // Get user from auth middleware
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      // Generate OAuth URL
      const authUrl = OAuthService.generateAuthUrl(validatedProvider, authenticatedReq.user.userId);
      
      res.json({
        success: true,
        data: {
          authUrl,
          provider: validatedProvider
        },
        message: "OAuth URL generated successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: "Invalid provider",
          details: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to initiate OAuth flow"
      });
    }
  }

  /**
   * Handle OAuth callback from provider
   */
  static async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const provider = req.params.provider as string;
      
      // Validate provider
      const validatedProvider = ProviderSchema.parse(provider);
      
      // Validate callback data
      const callbackData = OAuthCallbackSchema.parse(req.query);
      
      // Handle OAuth callback
      const connectedAccount = await OAuthService.handleCallback(
        validatedProvider,
        callbackData
      );
      
      res.json({
        success: true,
        data: connectedAccount,
        message: "Account connected successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: "Invalid callback data",
          details: error.message
        });
        return;
      }
      
      if (error instanceof Error) {
        // Handle specific OAuth errors
        if (error.message.includes('OAuth error:')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
        
        if (error.message.includes('Invalid OAuth state')) {
          res.status(400).json({
            success: false,
            error: "Invalid or expired OAuth state"
          });
          return;
        }
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to connect account"
      });
    }
  }

  /**
   * Get all connected accounts for authenticated user
   */
  static async getConnectedAccounts(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const accounts = await OAuthService.getConnectedAccounts(authenticatedReq.user.userId);
      
      res.json({
        success: true,
        data: accounts,
        message: "Connected accounts retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve connected accounts"
      });
    }
  }

  /**
   * Disconnect a connected account
   */
  static async disconnectAccount(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      await OAuthService.disconnectAccount(authenticatedReq.user.userId, accountId as string);
      
      res.json({
        success: true,
        message: "Account disconnected successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Connected account not found"
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to disconnect account"
      });
    }
  }

  /**
   * Refresh access token for a connected account
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const updatedAccount = await OAuthService.refreshAccessToken(accountId as string);
      
      res.json({
        success: true,
        data: updatedAccount,
        message: "Token refreshed successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Connected account not found or no refresh token available"
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to refresh token"
      });
    }
  }
}