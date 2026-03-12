import express from "express";
import { loginController, registerController } from "@/controllers/auth.controller";
import validateSchema from "@/middleware/validatezod";
import { UserCreateSchema, UserLoginSchema } from "@/types/validation";

const router = express.Router();

// Auth routes
router.post("/register", validateSchema(UserCreateSchema), registerController);
router.post("/login", validateSchema(UserLoginSchema), loginController);

export default router;