import express from "express";
import { getProfile, updateProfile, getAllUsers } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, upload.single("profileImage"), updateProfile);

// Admin: Get all users
router.get("/", authenticate, getAllUsers);

export default router;
