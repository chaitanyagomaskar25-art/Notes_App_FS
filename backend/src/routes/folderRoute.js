import { Router } from "express";
import { verifyAccessToken } from "../middleware/authMiddleware.js";
import {
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
} from "../controller/folderController.js";

const router = Router();
router.use(verifyAccessToken);

router.get("/", getFolders);
router.post("/", createFolder);
router.put("/:id", renameFolder);
router.delete("/:id", deleteFolder);

export const folderRouter = router;