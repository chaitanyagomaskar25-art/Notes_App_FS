import { Router } from "express";
import { verifyAccessToken } from "../middleware/authMiddleware.js";
import {
  githubAuth,
  githubCallback,
  githubStatus,
  githubDisconnect,
  listRepos,
  repoInfo,
  generateReadme,
} from "../controller/githubController.js";

const router = Router();

// OAuth
router.get("/auth", verifyAccessToken, githubAuth);
router.get("/callback", githubCallback);

// Status
router.get("/status", verifyAccessToken, githubStatus);
router.post("/disconnect", verifyAccessToken, githubDisconnect);

// Repos
router.get("/repos", verifyAccessToken, listRepos);
router.get("/repo/:owner/:repo", verifyAccessToken, repoInfo);
router.post("/generate-readme", verifyAccessToken, generateReadme);

export const githubRouter = router;