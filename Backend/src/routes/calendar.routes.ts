import express from "express";
import { CalendarController } from "@/controllers/calendar.controller";
import { authenticate } from "@/middleware/auth.middleware";
import validateSchema from "@/middleware/validatezod";
import { CalendarSyncRequestSchema } from "@/types/validation";

const router = express.Router();

// All calendar routes require authentication
router.use(authenticate);

// Calendar management routes
router.get("/", CalendarController.getUserCalendars);
router.post("/events", validateSchema(CalendarSyncRequestSchema), CalendarController.getCalendarEvents);
router.patch("/:calendarId/toggle", CalendarController.toggleCalendarStatus);

// Sync routes
router.post("/sync/account/:accountId", CalendarController.syncAccountCalendars);
router.post("/sync/calendar/:calendarId/events", CalendarController.syncCalendarEvents);
router.post("/sync/all", CalendarController.syncAllUserData);

export default router;