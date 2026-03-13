import express from "express";
import { loginController, registerController } from "@/controllers/auth.controller";
import validateSchema from "@/middleware/validatezod";
import { UserCreateSchema, UserLoginSchema } from "@/types/validation";
import { authRateLimit } from "@/middleware/rate-limit.middleware";

const router = express.Router();

// Apply rate limiting to auth routes
router.use(authRateLimit);

// Auth routes
router.post("/register", validateSchema(UserCreateSchema), registerController);
router.post("/login", validateSchema(UserLoginSchema), loginController);

export default router;