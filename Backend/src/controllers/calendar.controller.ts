import { Request, Response } from "express";
import { CalendarService } from "@/services/calendar.service";
import { 
  EventSyncRequestSchema,
  CalendarPaginationSchema,
  EventPaginationSchema
} from "@/types/validation";
import { JwtPayload } from "@/utils/jwt";
import { prisma } from "@/utils/prisma";

// Extend Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export class CalendarController {
  /**
   * Get all calendars for authenticated user with pagination
   */
  static async getUserCalendars(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      // Parse pagination parameters
      const pagination = CalendarPaginationSchema.parse({
        page: req.query.page,
        limit: req.query.limit,
      });

      const result = await CalendarService.getUserCalendars(
        authenticatedReq.user.userId,
        pagination
      );
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: "Calendars retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve calendars"
      });
    }
  }

  /**
   * Get events for specific calendars with pagination
   */
  static async getCalendarEvents(req: Request, res: Response): Promise<void> {
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
      const { calendarIds } = req.body;

      // Parse pagination parameters
      const pagination = EventPaginationSchema.parse({
        page: req.query.page,
        limit: req.query.limit,
      });

      // Validate date range if provided
      let dateRange;
      if (req.query.startDate || req.query.endDate) {
        try {
          const validatedRange = EventSyncRequestSchema.parse({
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
          
          dateRange = {
            start: validatedRange.startDate ? new Date(validatedRange.startDate) : undefined,
            end: validatedRange.endDate ? new Date(validatedRange.endDate) : undefined,
          };
        } catch (error) {
          res.status(400).json({
            success: false,
            error: "Invalid date range format",
            details: error
          });
          return;
        }
      }

      const result = await CalendarService.getCalendarEvents(
        calendarIds,
        dateRange?.start,
        dateRange?.end,
        pagination
      );
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: "Events retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve events"
      });
    }
  }

  /**
   * Sync calendars for a specific connected account
   */
  static async syncAccountCalendars(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { accountId } = req.params;
      
      if (!accountId || typeof accountId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Account ID is required"
        });
        return;
      }

      // Verify user owns this connected account
      const account = await prisma.connectedAccount.findFirst({
        where: {
          id: accountId,
          userId: authenticatedReq.user.userId,
        },
      });

      if (!account) {
        res.status(404).json({
          success: false,
          error: "Connected account not found"
        });
        return;
      }

      const calendars = await CalendarService.syncCalendarsForAccount(accountId);
      
      res.json({
        success: true,
        data: calendars,
        message: "Calendars synced successfully"
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to sync calendars"
      });
    }
  }

  /**
   * Sync events for a specific calendar
   */
  static async syncCalendarEvents(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { calendarId } = req.params;
      
      if (!calendarId || typeof calendarId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Calendar ID is required"
        });
        return;
      }

      // Verify user owns this calendar
      const calendar = await prisma.calendar.findFirst({
        where: {
          id: calendarId,
          connectedAccount: {
            userId: authenticatedReq.user.userId,
          },
        },
      });

      if (!calendar) {
        res.status(404).json({
          success: false,
          error: "Calendar not found"
        });
        return;
      }

      // Parse date range if provided
      let dateRange;
      if (req.query.startDate || req.query.endDate) {
        try {
          const validatedRange = EventSyncRequestSchema.parse({
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
          
          dateRange = {
            start: new Date(validatedRange.startDate || Date.now()),
            end: new Date(validatedRange.endDate || Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months default
          };
        } catch (error) {
          res.status(400).json({
            success: false,
            error: "Invalid date range format",
            details: error
          });
          return;
        }
      }

      const events = await CalendarService.syncEventsForCalendar(calendarId, dateRange);
      
      res.json({
        success: true,
        data: events,
        message: "Events synced successfully"
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to sync events"
      });
    }
  }

  /**
   * Sync all calendars and events for authenticated user
   */
  static async syncAllUserData(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const result = await CalendarService.syncAllForUser(authenticatedReq.user.userId);
      
      res.json({
        success: true,
        data: result,
        message: `Synced ${result.calendars.length} calendars and ${result.events.length} events`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to sync user data"
      });
    }
  }

  /**
   * Toggle calendar active status
   */
  static async toggleCalendarStatus(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required"
        });
        return;
      }

      const { calendarId } = req.params;
      
      if (!calendarId || typeof calendarId !== 'string') {
        res.status(400).json({
          success: false,
          error: "Calendar ID is required"
        });
        return;
      }

      const calendar = await CalendarService.toggleCalendarStatus(
        calendarId, 
        authenticatedReq.user.userId
      );
      
      res.json({
        success: true,
        data: calendar,
        message: `Calendar ${calendar.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: "Calendar not found or access denied"
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to toggle calendar status"
      });
    }
  }
}