import express from "express";
import { getProfile, getAllUsers, updateProfile } from "../controllers/userController.js";
import { getOpenBusinesses } from "../controllers/businessController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/", protect, adminOnly, getAllUsers);
router.get("/businesses/open", getOpenBusinesses);

export default router;
