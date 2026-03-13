import express from "express";
import { BoardController } from "@/controllers/board.controller";
import { authenticate } from "@/middleware/auth.middleware";
import validateSchema from "@/middleware/validatezod";
import { 
  CalendarBoardCreateSchema,
  CalendarBoardUpdateSchema,
  BoardCalendarCreateSchema,
  BoardCalendarUpdateSchema
} from "@/types/validation";

const router = express.Router();

// All board routes require authentication
router.use(authenticate);

// Board CRUD operations
router.post("/", validateSchema(CalendarBoardCreateSchema), BoardController.createBoard);
router.get("/", BoardController.getUserBoards);
router.get("/:boardId", BoardController.getBoardById);
router.patch("/:boardId", validateSchema(CalendarBoardUpdateSchema), BoardController.updateBoard);
router.delete("/:boardId", BoardController.deleteBoard);

// Board calendar management
router.post("/:boardId/calendars", validateSchema(BoardCalendarCreateSchema), BoardController.addCalendarToBoard);
router.delete("/:boardId/calendars/:calendarId", BoardController.removeCalendarFromBoard);
router.patch("/:boardId/calendars/:calendarId", validateSchema(BoardCalendarUpdateSchema), BoardController.updateCalendarColor);

// Board events
router.get("/:boardId/events", BoardController.getBoardEvents);

export default router;