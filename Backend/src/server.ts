import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./utils/prisma";

const startServer = async (): Promise<void> => {
  try {
    // ── 1. Test database connection ───────────────────────
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // ── 2. Start HTTP server ──────────────────────────────
    const server = app.listen(Number(env.PORT), () => {
      console.log("");
      console.log("🚀 Calendar X API is running");
      console.log(`   → Local:   http://localhost:${env.PORT}`);
      console.log(`   → Health:  http://localhost:${env.PORT}/health`);
      console.log(`   → Env:     ${env.NODE_ENV}`);
      console.log("");
    });

    // ── 3. Graceful shutdown ──────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received — shutting down gracefully...`);

      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log("✅ Database disconnected");
          console.log("👋 Server closed");
          process.exit(0);
        } catch (err) {
          console.error("❌ Error during shutdown:", err);
          process.exit(1);
        }
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        console.error("⚠️  Forced shutdown after timeout");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // ── 4. Unhandled rejections / exceptions ──────────────
    process.on("unhandledRejection", (reason: unknown) => {
      console.error("❌ Unhandled Rejection:", reason);
      shutdown("unhandledRejection");
    });

    process.on("uncaughtException", (error: Error) => {
      console.error("❌ Uncaught Exception:", error);
      shutdown("uncaughtException");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
