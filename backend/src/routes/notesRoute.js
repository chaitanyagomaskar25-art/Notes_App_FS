import { Router } from "express";
import { verifyAccessToken } from "../middleware/authMiddleware.js";
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  emptyTrash,
  updateCollaborators,
  getVersions,
  restoreVersion,
} from "../controller/notesController.js";

const router = Router();

router.use(verifyAccessToken);

router.get("/", getNotes);
router.post("/", createNote);
router.delete("/trash/empty", emptyTrash);
router.post("/:id/restore", restoreNote);
router.delete("/:id/permanent", permanentDeleteNote);
router.get("/:id/versions", getVersions);
router.post("/:id/versions/:versionId/restore", restoreVersion);
router.get("/:id", getNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);
router.put("/:id/collaborators", updateCollaborators);

export const notesRouter = router;