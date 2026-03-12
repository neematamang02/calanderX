import { Request, Response, NextFunction } from "express";
import { JwtPayload, verifyToken } from "@/utils/jwt";
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ messsage: "No token provided" });
            return;
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        req.user = decoded;
        next();

    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Authentication failed";
        const status = message === "Token has expired" ? 401 : 403;
        res.status(status).json({ message });
    }
};


// export const authorizeUser = (userIdParam = "id") =>
//   (req: Request, res: Response, next: NextFunction): void => {
//     const paramId = req.params[userIdParam];

//     if (req.user?.userId !== paramId) {
//       res.status(403).json({ message: "Forbidden: access denied" });
//       return;
//     }

//     next();
//   };