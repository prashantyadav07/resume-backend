// --- START OF FILE controllers/userController.js ---

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userSchema.js";

const syncUser = asyncHandler(async (req, res) => {
    // UID comes from our verified Firebase token in the auth middleware
    const firebaseUID = req.user.uid;
    const { email, name, picture } = req.body;

    if (!firebaseUID || !email || !name) {
        throw new ApiError(400, "User information is missing");
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUID });

    if (user) {
        // Optional: Update user info if it has changed
        user.username = name;
        user.email = email;
        user.coverImage = picture || user.coverImage;
        await user.save();
        return res.status(200).json(new ApiResponse(200, user, "User information updated"));
    } else {
        // Create new user if they don't exist
        const newUser = await User.create({
            firebaseUID,
            email,
            username: name,
            coverImage: picture || "",
        });
        return res.status(201).json(new ApiResponse(201, newUser, "User created successfully"));
    }
});

export { syncUser };