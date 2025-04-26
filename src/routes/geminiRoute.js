// routes/geminiRoutes.js
import { Router } from "express";
import { analyzeResume } from "../controllers/geminiController.js";

const router = Router();

// Route to analyze and rate a resume using Gemini AI
router.get("/analyze/:id", analyzeResume);

export default router;