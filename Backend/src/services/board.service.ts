import { prisma } from "@/utils/prisma";
import { 
  CalendarBoardCreate,
  CalendarBoardUpdate,
  CalendarBoardResponse,
  BoardCalendarCreate,
  BoardCalendarResponse,
  EventResponse,
  CalendarResponse
} from "@/types/validation";

export interface BoardWithCalendars extends CalendarBoardResponse {
  boardCalendars: (BoardCalendarResponse & {
    calendar: CalendarResponse;
  })[];
}

export interface BoardEventsResponse {
  board: BoardWithCalendars;
  events: EventResponse[];
  totalEvents: number;
}

export class BoardService {
  /**
   * Create a new calendar board
   */
  static async createBoard(
    userId: string,
    boardData: CalendarBoardCreate
  ): Promise<CalendarBoardResponse> {
    const board = await prisma.calendarBoard.create({
      data: {
        userId,
        ...boardData,
      },
    });

    return {
      id: board.id,
      userId: board.userId,
      name: board.name,
      description: board.description,
      maskEvents: board.maskEvents,
      maskLabel: board.maskLabel,
      showPastEvents: board.showPastEvents,
      pastDaysLimit: board.pastDaysLimit,
      futureDaysLimit: board.futureDaysLimit,
      onlyCurrentWeek: board.onlyCurrentWeek,
      twoWeeksAhead: board.twoWeeksAhead,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }

  /**
   * Get all boards for a user
   */
  static async getUserBoards(userId: string): Promise<BoardWithCalendars[]> {
    const boards = await prisma.calendarBoard.findMany({
      where: { userId },
      include: {
        boardCalendars: {
          include: {
            calendar: {
              include: {
                connectedAccount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return boards.map(board => ({
      id: board.id,
      userId: board.userId,
      name: board.name,
      description: board.description,
      maskEvents: board.maskEvents,
      maskLabel: board.maskLabel,
      showPastEvents: board.showPastEvents,
      pastDaysLimit: board.pastDaysLimit,
      futureDaysLimit: board.futureDaysLimit,
      onlyCurrentWeek: board.onlyCurrentWeek,
      twoWeeksAhead: board.twoWeeksAhead,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      boardCalendars: board.boardCalendars.map(bc => ({
        id: bc.id,
        boardId: bc.boardId,
        calendarId: bc.calendarId,
        color: bc.color,
        createdAt: bc.createdAt,
        calendar: {
          id: bc.calendar.id,
          connectedAccountId: bc.calendar.connectedAccountId,
          externalCalendarId: bc.calendar.externalCalendarId,
          name: bc.calendar.name,
          description: bc.calendar.description,
          timezone: bc.calendar.timezone,
          defaultColor: bc.calendar.defaultColor,
          isActive: bc.calendar.isActive,
          createdAt: bc.calendar.createdAt,
          updatedAt: bc.calendar.updatedAt,
        },
      })),
    }));
  }

  /**
   * Get a specific board by ID
   */
  static async getBoardById(
    boardId: string,
    userId?: string
  ): Promise<BoardWithCalendars | null> {
    const whereClause: any = { id: boardId };
    if (userId) {
      whereClause.userId = userId;
    }

    const board = await prisma.calendarBoard.findFirst({
      where: whereClause,
      include: {
        boardCalendars: {
          include: {
            calendar: {
              include: {
                connectedAccount: true,
              },
            },
          },
        },
      },
    });

    if (!board) return null;

    return {
      id: board.id,
      userId: board.userId,
      name: board.name,
      description: board.description,
      maskEvents: board.maskEvents,
      maskLabel: board.maskLabel,
      showPastEvents: board.showPastEvents,
      pastDaysLimit: board.pastDaysLimit,
      futureDaysLimit: board.futureDaysLimit,
      onlyCurrentWeek: board.onlyCurrentWeek,
      twoWeeksAhead: board.twoWeeksAhead,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      boardCalendars: board.boardCalendars.map(bc => ({
        id: bc.id,
        boardId: bc.boardId,
        calendarId: bc.calendarId,
        color: bc.color,
        createdAt: bc.createdAt,
        calendar: {
          id: bc.calendar.id,
          connectedAccountId: bc.calendar.connectedAccountId,
          externalCalendarId: bc.calendar.externalCalendarId,
          name: bc.calendar.name,
          description: bc.calendar.description,
          timezone: bc.calendar.timezone,
          defaultColor: bc.calendar.defaultColor,
          isActive: bc.calendar.isActive,
          createdAt: bc.calendar.createdAt,
          updatedAt: bc.calendar.updatedAt,
        },
      })),
    };
  }

  /**
   * Update a board
   */
  static async updateBoard(
    boardId: string,
    userId: string,
    updateData: CalendarBoardUpdate
  ): Promise<CalendarBoardResponse> {
    // Verify user owns this board
    const existingBoard = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!existingBoard) {
      throw new Error('Board not found or access denied');
    }

    const board = await prisma.calendarBoard.update({
      where: { id: boardId },
      data: updateData,
    });

    return {
      id: board.id,
      userId: board.userId,
      name: board.name,
      description: board.description,
      maskEvents: board.maskEvents,
      maskLabel: board.maskLabel,
      showPastEvents: board.showPastEvents,
      pastDaysLimit: board.pastDaysLimit,
      futureDaysLimit: board.futureDaysLimit,
      onlyCurrentWeek: board.onlyCurrentWeek,
      twoWeeksAhead: board.twoWeeksAhead,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }

  /**
   * Delete a board
   */
  static async deleteBoard(boardId: string, userId: string): Promise<void> {
    // Verify user owns this board
    const existingBoard = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!existingBoard) {
      throw new Error('Board not found or access denied');
    }

    await prisma.calendarBoard.delete({
      where: { id: boardId },
    });
  }

  /**
   * Add calendar to board
   */
  static async addCalendarToBoard(
    boardId: string,
    userId: string,
    calendarData: BoardCalendarCreate
  ): Promise<BoardCalendarResponse> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    // Verify user owns the calendar
    const calendar = await prisma.calendar.findFirst({
      where: {
        id: calendarData.calendarId,
        connectedAccount: { userId },
      },
    });

    if (!calendar) {
      throw new Error('Calendar not found or access denied');
    }

    const boardCalendar = await prisma.boardCalendar.create({
      data: calendarData,
    });

    return {
      id: boardCalendar.id,
      boardId: boardCalendar.boardId,
      calendarId: boardCalendar.calendarId,
      color: boardCalendar.color,
      createdAt: boardCalendar.createdAt,
    };
  }

  /**
   * Remove calendar from board
   */
  static async removeCalendarFromBoard(
    boardId: string,
    calendarId: string,
    userId: string
  ): Promise<void> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    await prisma.boardCalendar.delete({
      where: {
        boardId_calendarId: {
          boardId,
          calendarId,
        },
      },
    });
  }

  /**
   * Update calendar color in board
   */
  static async updateCalendarColor(
    boardId: string,
    calendarId: string,
    userId: string,
    color: string
  ): Promise<BoardCalendarResponse> {
    // Verify user owns this board
    const board = await prisma.calendarBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    const boardCalendar = await prisma.boardCalendar.update({
      where: {
        boardId_calendarId: {
          boardId,
          calendarId,
        },
      },
      data: { color },
    });

    return {
      id: boardCalendar.id,
      boardId: boardCalendar.boardId,
      calendarId: boardCalendar.calendarId,
      color: boardCalendar.color,
      createdAt: boardCalendar.createdAt,
    };
  }

  /**
   * Get board events with filtering and masking
   */
  static async getBoardEvents(
    boardId: string,
    userId?: string,
    requestedStartDate?: Date,
    requestedEndDate?: Date
  ): Promise<BoardEventsResponse> {
    const board = await this.getBoardById(boardId, userId);
    
    if (!board) {
      throw new Error('Board not found');
    }

    // Calculate date range based on board settings
    const { startDate, endDate } = this.calculateDateRange(
      board,
      requestedStartDate,
      requestedEndDate
    );

    // Get calendar IDs from board
    const calendarIds = board.boardCalendars.map(bc => bc.calendarId);

    if (calendarIds.length === 0) {
      return {
        board,
        events: [],
        totalEvents: 0,
      };
    }

    // Build where clause for events
    const whereClause: any = {
      calendarId: { in: calendarIds },
      calendar: { isActive: true },
    };

    // Apply date filtering
    if (startDate || endDate) {
      whereClause.AND = [];
      
      if (startDate) {
        whereClause.AND.push({
          endTime: { gte: startDate },
        });
      }
      
      if (endDate) {
        whereClause.AND.push({
          startTime: { lte: endDate },
        });
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        calendar: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Apply masking and color coding
    const processedEvents: EventResponse[] = events.map(event => {
      const boardCalendar = board.boardCalendars.find(
        bc => bc.calendarId === event.calendarId
      );

      return {
        id: event.id,
        calendarId: event.calendarId,
        externalId: event.externalId,
        title: board.maskEvents ? (board.maskLabel || 'Busy') : event.title,
        description: board.maskEvents ? null : event.description,
        location: board.maskEvents ? null : event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay,
        status: event.status,
        recurrence: event.recurrence,
        htmlLink: board.maskEvents ? null : event.htmlLink,
        syncedAt: event.syncedAt,
        updatedAt: event.updatedAt,
      };
    });

    return {
      board,
      events: processedEvents,
      totalEvents: processedEvents.length,
    };
  }

  /**
   * Calculate date range based on board settings
   */
  private static calculateDateRange(
    board: BoardWithCalendars,
    requestedStartDate?: Date,
    requestedEndDate?: Date
  ): { startDate?: Date; endDate?: Date } {
    const now = new Date();
    let startDate = requestedStartDate;
    let endDate = requestedEndDate;

    // Handle current week only
    if (board.onlyCurrentWeek) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { startDate: startOfWeek, endDate: endOfWeek };
    }

    // Handle two weeks ahead
    if (board.twoWeeksAhead) {
      const twoWeeksFromNow = new Date(now);
      twoWeeksFromNow.setDate(now.getDate() + 14);
      
      if (!endDate || endDate > twoWeeksFromNow) {
        endDate = twoWeeksFromNow;
      }
    }

    // Handle past events
    if (!board.showPastEvents) {
      startDate = now;
    } else if (board.pastDaysLimit) {
      const pastLimit = new Date(now);
      pastLimit.setDate(now.getDate() - board.pastDaysLimit);
      
      if (!startDate || startDate < pastLimit) {
        startDate = pastLimit;
      }
    }

    // Handle future events limit
    if (board.futureDaysLimit) {
      const futureLimit = new Date(now);
      futureLimit.setDate(now.getDate() + board.futureDaysLimit);
      
      if (!endDate || endDate > futureLimit) {
        endDate = futureLimit;
      }
    }

    return { startDate, endDate };
  }
}