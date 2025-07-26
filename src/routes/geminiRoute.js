// --- START OF FILE routes/geminiRoute.js ---

import { Router } from "express";
import { analyzeResume } from "../controllers/geminiController.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = Router();

// Protected route
router.route("/analyze/:id").get(verifyFirebaseToken, analyzeResume);

export default router;