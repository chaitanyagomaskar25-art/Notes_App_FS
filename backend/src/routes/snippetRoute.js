import { Router } from "express";
import { verifyAccessToken } from "../middleware/authMiddleware.js";
import {
  getSnippets,
  createSnippet,
  updateSnippet,
  deleteSnippet,
} from "../controller/snippetController.js";

const router = Router();
router.use(verifyAccessToken);

router.get("/", getSnippets);
router.post("/", createSnippet);
router.put("/:id", updateSnippet);
router.delete("/:id", deleteSnippet);

export const snippetRouter = router;