import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// Public Authentication Endpoints
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/reset-password", AuthController.resetPassword);
router.post("/logout", AuthController.logout);

// Protected Authentication Endpoints
router.get("/me", requireAuth, AuthController.getMe);

export const authRoutes = router;
