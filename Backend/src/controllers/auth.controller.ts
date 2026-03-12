import { Request, Response } from "express";
import { loginService, registerService } from "@/services/auth.service";
import { UserCreateSchema, UserLoginSchema } from "@/types/validation";
import { ApiSuccessResponseSchema, ApiErrorResponseSchema } from "@/types/validation";

export const registerController = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body using Zod schema
        const validatedData = UserCreateSchema.parse(req.body);
        
        // Call service with validated data
        const result = await registerService(validatedData);
        
        // Return success response
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof Error && error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: error.message
            });
            return;
        }
        
        // Handle business logic errors
        if (error instanceof Error) {
            const statusCode = error.message === "Email already in use" ? 409 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message
            });
            return;
        }
        
        // Handle unexpected errors
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body using Zod schema
        const validatedData = UserLoginSchema.parse(req.body);
        
        // Call service with validated data
        const result = await loginService(validatedData);
        
        // Return success response
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof Error && error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: error.message
            });
            return;
        }
        
        // Handle authentication errors
        if (error instanceof Error) {
            const statusCode = error.message === "Invalid credentials" ? 401 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message
            });
            return;
        }
        
        // Handle unexpected errors
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};