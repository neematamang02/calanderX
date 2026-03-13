import { prisma } from "@/utils/prisma";
import { 
  SharedLinkCreate,
  SharedLinkUpdate,
  SharedLinkResponse
} from "@/types/validation";
import { BoardService, BoardEventsResponse } from "./board.service";
import crypto from "crypto";

export class ShareService {
  /**
   * Create or get existing shared link for a board
   */
  static async createSharedLink(
    boardId: string,
    userId: string
  ): Promise<SharedLinkResponse> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    // Check if shared link already exists
    const existingLink = await prisma.sharedLink.findUnique({
      where: { boardId },
    });

    if (existingLink) {
      return {
        id: existingLink.id,
        boardId: existingLink.boardId,
        token: existingLink.token,
        isActive: existingLink.isActive,
        viewCount: existingLink.viewCount,
        createdAt: existingLink.createdAt,
        updatedAt: existingLink.updatedAt,
      };
    }

    // Create new shared link with unique token
    const token = this.generateUniqueToken();
    
    const sharedLink = await prisma.sharedLink.create({
      data: {
        boardId,
        token,
        isActive: true,
      },
    });

    return {
      id: sharedLink.id,
      boardId: sharedLink.boardId,
      token: sharedLink.token,
      isActive: sharedLink.isActive,
      viewCount: sharedLink.viewCount,
      createdAt: sharedLink.createdAt,
      updatedAt: sharedLink.updatedAt,
    };
  }

  /**
   * Get shared link by board ID
   */
  static async getSharedLinkByBoardId(
    boardId: string,
    userId: string
  ): Promise<SharedLinkResponse | null> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    const sharedLink = await prisma.sharedLink.findUnique({
      where: { boardId },
    });

    if (!sharedLink) {
      return null;
    }

    return {
      id: sharedLink.id,
      boardId: sharedLink.boardId,
      token: sharedLink.token,
      isActive: sharedLink.isActive,
      viewCount: sharedLink.viewCount,
      createdAt: sharedLink.createdAt,
      updatedAt: sharedLink.updatedAt,
    };
  }

  /**
   * Update shared link settings
   */
  static async updateSharedLink(
    boardId: string,
    userId: string,
    updateData: SharedLinkUpdate
  ): Promise<SharedLinkResponse> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    const sharedLink = await prisma.sharedLink.update({
      where: { boardId },
      data: updateData,
    });

    return {
      id: sharedLink.id,
      boardId: sharedLink.boardId,
      token: sharedLink.token,
      isActive: sharedLink.isActive,
      viewCount: sharedLink.viewCount,
      createdAt: sharedLink.createdAt,
      updatedAt: sharedLink.updatedAt,
    };
  }

  /**
   * Delete shared link
   */
  static async deleteSharedLink(
    boardId: string,
    userId: string
  ): Promise<void> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    await prisma.sharedLink.delete({
      where: { boardId },
    });
  }

  /**
   * Get board data by shared token (public access)
   */
  static async getBoardByToken(
    token: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BoardEventsResponse> {
    const sharedLink = await prisma.sharedLink.findUnique({
      where: { token },
      include: {
        board: true,
      },
    });

    if (!sharedLink) {
      throw new Error('Shared link not found');
    }

    if (!sharedLink.isActive) {
      throw new Error('Shared link is disabled');
    }

    // Increment view count
    await prisma.sharedLink.update({
      where: { token },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Get board events using BoardService (no userId required for public access)
    const boardEvents = await BoardService.getBoardEvents(
      sharedLink.boardId,
      undefined, // No userId for public access
      startDate,
      endDate
    );

    return boardEvents;
  }

  /**
   * Get shared link analytics
   */
  static async getSharedLinkAnalytics(
    boardId: string,
    userId: string
  ): Promise<{
    sharedLink: SharedLinkResponse;
    analytics: {
      totalViews: number;
      isActive: boolean;
      createdDaysAgo: number;
      lastViewedAt?: Date;
    };
  }> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    const sharedLink = await prisma.sharedLink.findUnique({
      where: { boardId },
    });

    if (!sharedLink) {
      throw new Error('Shared link not found');
    }

    const createdDaysAgo = Math.floor(
      (Date.now() - sharedLink.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      sharedLink: {
        id: sharedLink.id,
        boardId: sharedLink.boardId,
        token: sharedLink.token,
        isActive: sharedLink.isActive,
        viewCount: sharedLink.viewCount,
        createdAt: sharedLink.createdAt,
        updatedAt: sharedLink.updatedAt,
      },
      analytics: {
        totalViews: sharedLink.viewCount,
        isActive: sharedLink.isActive,
        createdDaysAgo,
        lastViewedAt: sharedLink.updatedAt,
      },
    };
  }

  /**
   * Regenerate shared link token
   */
  static async regenerateToken(
    boardId: string,
    userId: string
  ): Promise<SharedLinkResponse> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    const newToken = this.generateUniqueToken();

    const sharedLink = await prisma.sharedLink.update({
      where: { boardId },
      data: {
        token: newToken,
        viewCount: 0, // Reset view count with new token
        updatedAt: new Date(),
      },
    });

    return {
      id: sharedLink.id,
      boardId: sharedLink.boardId,
      token: sharedLink.token,
      isActive: sharedLink.isActive,
      viewCount: sharedLink.viewCount,
      createdAt: sharedLink.createdAt,
      updatedAt: sharedLink.updatedAt,
    };
  }

  /**
   * Get all shared links for a user
   */
  static async getUserSharedLinks(userId: string): Promise<Array<{
    sharedLink: SharedLinkResponse;
    boardName: string;
    boardDescription?: string;
  }>> {
    const sharedLinks = await prisma.sharedLink.findMany({
      where: {
        board: {
          userId,
        },
      },
      include: {
        board: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sharedLinks.map(link => ({
      sharedLink: {
        id: link.id,
        boardId: link.boardId,
        token: link.token,
        isActive: link.isActive,
        viewCount: link.viewCount,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      },
      boardName: link.board.name,
      boardDescription: link.board.description,
    }));
  }

  /**
   * Generate a unique token for shared links
   */
  private static generateUniqueToken(): string {
    // Generate a URL-safe random token
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Validate token format
   */
  static isValidToken(token: string): boolean {
    // Check if token is base64url format and reasonable length
    return /^[A-Za-z0-9_-]{43}$/.test(token);
  }

  /**
   * Build public share URL
   */
  static buildShareUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.CLIENT_URL || 'http://localhost:5173';
    return `${base}/shared/${token}`;
  }
}