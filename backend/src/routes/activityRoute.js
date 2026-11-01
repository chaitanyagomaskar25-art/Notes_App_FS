import { Router } from "express";
import { verifyAccessToken } from "../middleware/authMiddleware.js";
import { logActivity, getActivities } from "../controller/activityController.js";

const router = Router();
router.use(verifyAccessToken);

router.get("/", getActivities);
router.post("/", logActivity);

export const activityRouter = router;