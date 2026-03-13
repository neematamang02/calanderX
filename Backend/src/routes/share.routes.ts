import express from "express";
import { ShareController } from "@/controllers/share.controller";
import { authenticate } from "@/middleware/auth.middleware";
import validateSchema from "@/middleware/validatezod";
import { SharedLinkUpdateSchema } from "@/types/validation";

const router = express.Router();

// PUBLIC ROUTES (no authentication required)
// These must come BEFORE the authenticate middleware
router.get("/public/:token", ShareController.getSharedBoard);

// PROTECTED ROUTES (authentication required)
router.use(authenticate);

// Shared link management for board owners
router.post("/boards/:boardId", ShareController.createSharedLink);
router.get("/boards/:boardId", ShareController.getSharedLink);
router.patch("/boards/:boardId", validateSchema(SharedLinkUpdateSchema), ShareController.updateSharedLink);
router.delete("/boards/:boardId", ShareController.deleteSharedLink);

// Shared link utilities
router.post("/boards/:boardId/regenerate", ShareController.regenerateToken);
router.get("/boards/:boardId/analytics", ShareController.getAnalytics);

// User's shared links overview
router.get("/", ShareController.getUserSharedLinks);

export default router;