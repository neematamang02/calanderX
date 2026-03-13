import express from "express";
import { OAuthController } from "@/controllers/oauth.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { oauthRateLimit } from "@/middleware/rate-limit.middleware";

const router = express.Router();

// Apply rate limiting to OAuth routes
router.use(oauthRateLimit);

// OAuth initiation routes (require authentication)
router.get("/connect/:provider", authenticate, OAuthController.initiateOAuth);

// OAuth callback routes (public - no auth required as state contains user info)
router.get("/callback/:provider", OAuthController.handleCallback);

// Connected accounts management (require authentication)
router.get("/accounts", authenticate, OAuthController.getConnectedAccounts);
router.delete("/accounts/:accountId", authenticate, OAuthController.disconnectAccount);
router.post("/accounts/:accountId/refresh", authenticate, OAuthController.refreshToken);

export default router;