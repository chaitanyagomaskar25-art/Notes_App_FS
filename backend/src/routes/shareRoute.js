import { Router } from "express";
import { verifyAccessToken } from "../middleware/authMiddleware.js";
import {
  createShare,
  listShares,
  revokeShare,
  viewShare,
} from "../controller/shareController.js";

const router = Router();

// Authenticated management routes
router.post("/notes/:id/share", verifyAccessToken, createShare);
router.get("/notes/:id/shares", verifyAccessToken, listShares);
router.delete("/shares/:id", verifyAccessToken, revokeShare);

// Public view route (optional auth handled in controller)
router.get("/share/:token", viewShare);

export const shareRouter = router;