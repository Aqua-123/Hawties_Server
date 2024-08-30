import express from "express";
import { signUp, signIn, getUserData } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/user", authMiddleware, getUserData);

export default router;
