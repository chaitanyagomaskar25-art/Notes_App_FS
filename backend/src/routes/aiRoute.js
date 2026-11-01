import { Router } from "express";
import { verifyAccessToken } from "../middleware/authMiddleware.js";
import { aiAssist } from "../controller/aiController.js";

const router = Router();
router.use(verifyAccessToken);
router.post("/assist", aiAssist);

export const aiRouter = router;