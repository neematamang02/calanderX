import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { notFound, errorHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import oauthRoutes from "./routes/oauth.routes";

const app: Application = express();

// ─────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─────────────────────────────────────────────
// Body Parsing
// ─────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Calendar X API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use("/user", authRoutes);
app.use("/api/oauth", oauthRoutes);
// app.use("/api/calendar", calendarRoutes);
// app.use("/api/boards",   boardRoutes);
// app.use("/api/share",    shareRoutes);

// ─────────────────────────────────────────────
// Error Handling — must be registered LAST
// ─────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);
export default app;
