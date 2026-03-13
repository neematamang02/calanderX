import { Request, Response } from "express";
import { ShareService } from "@/services/share.service";
import { 
  SharedLinkUpdateSchema,
  EventSyncRequestSchema,
  ShareTokenSchema
} from "@/types/validation";
import { JwtPayload } from "@/utils/jwt";

// Extend Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export class ShareController {
  /**
   * Create shared link for a board
   */
  static async createSharedLink(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { boardId } = req.params;
      
      if (!boardId || typeof boardId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Board ID is required"
        });
        return;
      }

      const sharedLink = await ShareService.createSharedLink(
        boardId,
        authenticatedReq.user.userId
      );

      // Build the full share URL
      const shareUrl = ShareService.buildShareUrl(sharedLink.token);

      res.status(201).json({
        success: true,
        data: {
          ...sharedLink,
          shareUrl,
        },
        message: "Shared link created successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Board not found or access denied"
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to create shared link"
      });
    }
  }

  /**
   * Get shared link for a board
   */
  static async getSharedLink(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { boardId } = req.params;
      
      if (!boardId || typeof boardId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Board ID is required"
        });
        return;
      }

      const sharedLink = await ShareService.getSharedLinkByBoardId(
        boardId,
        authenticatedReq.user.userId
      );

      if (!sharedLink) {
        res.status(404).json({
          success: false,
          error: "Shared link not found"
        });
        return;
      }

      // Build the full share URL
      const shareUrl = ShareService.buildShareUrl(sharedLink.token);

      res.json({
        success: true,
        data: {
          ...sharedLink,
          shareUrl,
        },
        message: "Shared link retrieved successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Board not found or access denied"
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to retrieve shared link"
      });
    }
  }

  /**
   * Update shared link settings
   */
  static async updateSharedLink(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { boardId } = req.params;
      
      if (!boardId || typeof boardId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Board ID is required"
        });
        return;
      }

      // Request body is already validated by middleware
      const updateData = req.body;

      const sharedLink = await ShareService.updateSharedLink(
        boardId,
        authenticatedReq.user.userId,
        updateData
      );

      // Build the full share URL
      const shareUrl = ShareService.buildShareUrl(sharedLink.token);

      res.json({
        success: true,
        data: {
          ...sharedLink,
          shareUrl,
        },
        message: "Shared link updated successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Board or shared link not found"
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to update shared link"
      });
    }
  }

  /**
   * Delete shared link
   */
  static async deleteSharedLink(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { boardId } = req.params;
      
      if (!boardId || typeof boardId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Board ID is required"
        });
        return;
      }

      await ShareService.deleteSharedLink(
        boardId,
        authenticatedReq.user.userId
      );

      res.json({
        success: true,
        message: "Shared link deleted successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Board or shared link not found"
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete shared link"
      });
    }
  }

  /**
   * Regenerate shared link token
   */
  static async regenerateToken(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { boardId } = req.params;
      
      if (!boardId || typeof boardId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Board ID is required"
        });
        return;
      }

      const sharedLink = await ShareService.regenerateToken(
        boardId,
        authenticatedReq.user.userId
      );

      // Build the full share URL
      const shareUrl = ShareService.buildShareUrl(sharedLink.token);

      res.json({
        success: true,
        data: {
          ...sharedLink,
          shareUrl,
        },
        message: "Shared link token regenerated successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Board or shared link not found"
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to regenerate token"
      });
    }
  }

  /**
   * Get shared link analytics
   */
  static async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { boardId } = req.params;
      
      if (!boardId || typeof boardId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Board ID is required"
        });
        return;
      }

      const analytics = await ShareService.getSharedLinkAnalytics(
        boardId,
        authenticatedReq.user.userId
      );

      // Build the full share URL
      const shareUrl = ShareService.buildShareUrl(analytics.sharedLink.token);

      res.json({
        success: true,
        data: {
          ...analytics,
          sharedLink: {
            ...analytics.sharedLink,
            shareUrl,
          },
        },
        message: "Analytics retrieved successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Board or shared link not found"
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to retrieve analytics"
      });
    }
  }

  /**
   * Get all shared links for user
   */
  static async getUserSharedLinks(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const sharedLinks = await ShareService.getUserSharedLinks(
        authenticatedReq.user.userId
      );

      // Add share URLs to each link
      const linksWithUrls = sharedLinks.map(link => ({
        ...link,
        sharedLink: {
          ...link.sharedLink,
          shareUrl: ShareService.buildShareUrl(link.sharedLink.token),
        },
      }));

      res.json({
        success: true,
        data: linksWithUrls,
        message: "Shared links retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve shared links"
      });
    }
  }

  /**
   * PUBLIC: Get board data by shared token (no authentication required)
   */
  static async getSharedBoard(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          error: "Share token is required"
        });
        return;
      }

      // Validate token format using schema
      try {
        ShareTokenSchema.parse(token);
      } catch (error) {
        res.status(400).json({
          success: false,
          error: "Invalid share token format"
        });
        return;
      }

      // Parse date range if provided
      let startDate, endDate;
      if (req.query.startDate || req.query.endDate) {
        try {
          const validatedRange = EventSyncRequestSchema.parse({
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
          
          startDate = validatedRange.startDate ? new Date(validatedRange.startDate) : undefined;
          endDate = validatedRange.endDate ? new Date(validatedRange.endDate) : undefined;
        } catch (error) {
          res.status(400).json({
            success: false,
            error: "Invalid date range format",
            details: error
          });
          return;
        }
      }

      const boardData = await ShareService.getBoardByToken(
        token,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: boardData,
        message: "Shared board retrieved successfully"
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: "Shared board not found"
          });
          return;
        }
        
        if (error.message.includes('disabled')) {
          res.status(403).json({
            success: false,
            error: "Shared link is disabled"
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to retrieve shared board"
      });
    }
  }
}