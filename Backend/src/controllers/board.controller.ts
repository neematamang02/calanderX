import { Request, Response } from "express";
import { BoardService } from "@/services/board.service";
import { 
  CalendarBoardCreateSchema,
  CalendarBoardUpdateSchema,
  BoardCalendarCreateSchema,
  BoardCalendarUpdateSchema,
  EventSyncRequestSchema
} from "@/types/validation";
import { JwtPayload } from "@/utils/jwt";

// Extend Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export class BoardController {
  /**
   * Create a new calendar board
   */
  static async createBoard(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      // Request body is already validated by middleware
      const boardData = req.body;

      const board = await BoardService.createBoard(
        authenticatedReq.user.userId,
        boardData
      );

      res.status(201).json({
        success: true,
        data: board,
        message: "Board created successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create board"
      });
    }
  }

  /**
   * Get all boards for authenticated user
   */
  static async getUserBoards(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const boards = await BoardService.getUserBoards(authenticatedReq.user.userId);

      res.json({
        success: true,
        data: boards,
        message: "Boards retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve boards"
      });
    }
  }

  /**
   * Get a specific board by ID
   */
  static async getBoardById(req: Request, res: Response): Promise<void> {
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

      const board = await BoardService.getBoardById(boardId, authenticatedReq.user.userId);

      if (!board) {
        res.status(404).json({
          success: false,
          error: "Board not found"
        });
        return;
      }

      res.json({
        success: true,
        data: board,
        message: "Board retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve board"
      });
    }
  }

  /**
   * Update a board
   */
  static async updateBoard(req: Request, res: Response): Promise<void> {
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

      const board = await BoardService.updateBoard(
        boardId,
        authenticatedReq.user.userId,
        updateData
      );

      res.json({
        success: true,
        data: board,
        message: "Board updated successfully"
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
        error: "Failed to update board"
      });
    }
  }

  /**
   * Delete a board
   */
  static async deleteBoard(req: Request, res: Response): Promise<void> {
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

      await BoardService.deleteBoard(boardId, authenticatedReq.user.userId);

      res.json({
        success: true,
        message: "Board deleted successfully"
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
        error: "Failed to delete board"
      });
    }
  }

  /**
   * Add calendar to board
   */
  static async addCalendarToBoard(req: Request, res: Response): Promise<void> {
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
      const calendarData = { ...req.body, boardId };

      const boardCalendar = await BoardService.addCalendarToBoard(
        boardId,
        authenticatedReq.user.userId,
        calendarData
      );

      res.status(201).json({
        success: true,
        data: boardCalendar,
        message: "Calendar added to board successfully"
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }
        
        if (error.message.includes('Unique constraint')) {
          res.status(409).json({
            success: false,
            error: "Calendar is already added to this board"
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to add calendar to board"
      });
    }
  }

  /**
   * Remove calendar from board
   */
  static async removeCalendarFromBoard(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { boardId, calendarId } = req.params;
      
      if (!boardId || typeof boardId !== 'string' || !calendarId || typeof calendarId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Board ID and Calendar ID are required"
        });
        return;
      }

      await BoardService.removeCalendarFromBoard(
        boardId,
        calendarId,
        authenticatedReq.user.userId
      );

      res.json({
        success: true,
        message: "Calendar removed from board successfully"
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
        error: "Failed to remove calendar from board"
      });
    }
  }

  /**
   * Update calendar color in board
   */
  static async updateCalendarColor(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { boardId, calendarId } = req.params;
      
      if (!boardId || typeof boardId !== 'string' || !calendarId || typeof calendarId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Board ID and Calendar ID are required"
        });
        return;
      }

      // Request body is already validated by middleware
      const { color } = req.body;

      const boardCalendar = await BoardService.updateCalendarColor(
        boardId,
        calendarId,
        authenticatedReq.user.userId,
        color
      );

      res.json({
        success: true,
        data: boardCalendar,
        message: "Calendar color updated successfully"
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
        error: "Failed to update calendar color"
      });
    }
  }

  /**
   * Get board events with filtering and masking
   */
  static async getBoardEvents(req: Request, res: Response): Promise<void> {
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

      const result = await BoardService.getBoardEvents(
        boardId,
        authenticatedReq.user.userId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: result,
        message: "Board events retrieved successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Board not found"
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to retrieve board events"
      });
    }
  }
}