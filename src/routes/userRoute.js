import { Router } from "express";
import {
  Register,
  loginUser,
  logoutUser,
 
} from "../controllers/userController.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT, isAdminLogin } from "../middlewares/auth.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  Register
);

router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);



export default router;
