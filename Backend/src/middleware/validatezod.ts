import { Request, Response, NextFunction } from "express";

const validateSchema = (schema: any) => {
    return (req:Request, res:Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: error
            });
        }
    };
};

export default validateSchema;