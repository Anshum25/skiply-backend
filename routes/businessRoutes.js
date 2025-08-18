// routes/businessRoutes.js

import express from "express";
import {
  registerBusiness,
  loginBusiness,
  getAllBusinesses,
  getOpenBusinesses,
  getAllBusinessDashboard,
  getBusinessById, // ✅ ADD THIS
} from "../controllers/businessController.js";
import { getNearbyBusinesses } from "../controllers/businessController.js";

const router = express.Router();
import multer from "multer";
const upload = multer();
router.post("/register", upload.none(), registerBusiness);

// 👤 Public routes
router.post("/register", registerBusiness);
router.post("/login", loginBusiness);
router.get("/all", getAllBusinesses); // All businesses (admin/user public)
router.get("/open", getOpenBusinesses); // Open businesses (for customers)
router.get("/dashboard", getAllBusinessDashboard);
router.get("/:id", getBusinessById);
router.get("/nearby", getNearbyBusinesses);
router.get("/", getAllBusinesses);

router.get("/:id/reviews", (req, res) => {
  // Just send mock reviews or an empty array
  res.json([
    {
      reviewer: "Anshum",
      rating: 5,
      comment: "Great experience!",
      createdAt: new Date(),
    },
  ]);
});

// ✅ Moved logic to controller

// 🔐 Protected routes (e.g. business dashboard)
// router.get('/dashboard', protect, businessOnly, getBusinessDashboard);

export default router;
