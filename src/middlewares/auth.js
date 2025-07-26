// --- START OF FILE middlewares/auth.js ---

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import admin from 'firebase-admin';

export const verifyFirebaseToken = asyncHandler(async (req, _, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        throw new ApiError(401, "Unauthorized Request: No token provided");
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Attach user info to the request object
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
        next();
    } catch (error) {
        console.error("Firebase token verification error:", error);
        throw new ApiError(401, "Unauthorized Request: Invalid or expired token");
    }
});