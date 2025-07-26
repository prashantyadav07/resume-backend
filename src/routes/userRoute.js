// --- START OF FILE routes/userRoute.js ---

import { Router } from "express";
import { syncUser } from "../controllers/userController.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = Router();

// This endpoint is called after a successful frontend login to sync user with our DB
router.route("/sync").post(verifyFirebaseToken, syncUser);

export default router;