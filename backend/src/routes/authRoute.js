import { Router } from "express";
import { getMe, login, logout, registration } from "../controller/authController.js";
import { verifyAccessToken } from "../middleware/authMiddleware.js";
import { refreshTokenAccess } from "../controller/refreshTokenController.js";

export const authRouter = Router()

authRouter.post("/register", registration)

authRouter.post("/login", login)

authRouter.post("/refresh", refreshTokenAccess)

authRouter.post("/logout", logout)

authRouter.get("/me", verifyAccessToken, getMe)

