// PATCH: Update opening hours for a business
export const updateOpeningHours = async (req, res) => {
  try {
    const businessId = req.params.id;
    const { openingHours } = req.body;
    if (!openingHours) {
      return res.status(400).json({ message: "Missing openingHours in request body" });
    }
    const updated = await Business.findByIdAndUpdate(
      businessId,
      { $set: { openingHours } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Business not found" });
    }
    res.status(200).json({ message: "Opening hours updated", openingHours: updated.openingHours });
  } catch (error) {
    console.error("Update Opening Hours Error:", error.message);
    res.status(500).json({ message: "Failed to update opening hours" });
  }
};
import Business from "../models/Business.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { haversineDistance } from "../utils/distance.js";

// 🔐 Utility: Generate JWT Token
const generateToken = (business) =>
  jwt.sign({ id: business._id, role: "business" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// ✅ REGISTER a new business
export const registerBusiness = async (req, res) => {
  try {
    const {
      ownerName,
      businessName,
      email,
      phone,
      password,
      category,
      address,
      description,
    } = req.body;

    // ✅ Convert coordinates from strings to numbers
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        message:
          "Coordinates (latitude and longitude) are required and must be valid numbers",
      });
    }

    // ✅ Parse JSON strings sent via FormData
    const departments = req.body.departments
      ? JSON.parse(req.body.departments)
      : [];
    const openingHours = req.body.openingHours
      ? JSON.parse(req.body.openingHours)
      : {};

    // Handle images - parse if provided, otherwise use empty array
    let imageArray = [];
    if (req.body.images) {
      try {
        imageArray = JSON.parse(req.body.images);
      } catch (error) {
        console.error("Error parsing images:", error);
        imageArray = [];
      }
    }

    const existingBusiness = await Business.findOne({ email });
    if (existingBusiness) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const coords = { lat: latitude, lng: longitude };

    const business = new Business({
      ownerName,
      businessName,
      email,
      phone,
      password: hashedPassword,
      category,
      address,
      description,
      departments,
      openingHours,
      location: coords,
      images: imageArray,
    });

    await business.save();

    const token = generateToken(business);

    res.status(201).json({
      message: "Business registered successfully",
      user: {
        id: business._id,
        name: business.ownerName,
        email: business.email,
        role: "business",
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// ✅ LOGIN for business
export const loginBusiness = async (req, res) => {
  try {
    const { email, password } = req.body;

    const business = await Business.findOne({ email });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const isMatch = await bcrypt.compare(password, business.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(business);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: business._id,
        name: business.ownerName,
        email: business.email,
        role: "business",
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ✅ Get all businesses
export const getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find().select("-password");
    res.status(200).json(businesses);
  } catch (error) {
    console.error("Fetch Businesses Error:", error.message);
    res.status(500).json({ message: "Failed to fetch businesses" });
  }
};

// ✅ Get only open businesses
// export const getOpenBusinesses = async (req, res) => {
//   try {
//     const day = new Date()
//       .toLocaleString("en-US", { weekday: "long" })
//       .toLowerCase();

//     const businesses = await Business.find({
//       [`openingHours.${day}.closed`]: false,
//     }).select("-password");

//     res.status(200).json(businesses);
//   } catch (error) {
//     console.error("Get Open Businesses Error:", error.message);
//     res.status(500).json({ message: "Failed to fetch open businesses" });
//   }
// };

// ✅ Get all businesses currently open
export const getOpenBusinesses = async (req, res) => {
  try {
    const now = new Date();
    const dayNames = [
      "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
    ];
    const today = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    const businesses = await Business.find().select("-password");
    const openBusinesses = businesses.filter(biz => {
      const hours = biz.openingHours?.[today];
      if (!hours || hours.closed) return false;
      return hours.start <= currentTime && currentTime <= hours.end;
    });

    res.status(200).json(openBusinesses);
  } catch (error) {
    console.error("Open Businesses Error:", error.message);
    res.status(500).json({ message: "Failed to load open businesses" });
  }
};

// ✅ Get all businesses for dashboard route
export const getAllBusinessDashboard = async (req, res) => {
  try {
    const businesses = await Business.find().select("-password");
    res.status(200).json(businesses);
  } catch (error) {
    console.error("Dashboard Businesses Error:", error.message);
    res
      .status(500)
      .json({ message: "Failed to load businesses for dashboard" });
  }
};

// ✅ Get single business by ID
export const getBusinessById = async (req, res) => {
  try {
    // Ensure we include _id in the response
    const business = await Business.findById(req.params.id).select("-password -__v");
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    // Convert to plain object to ensure all fields including _id are included
    const businessObj = business.toObject();
    res.status(200).json(businessObj);
  } catch (error) {
    console.error("Get Business By ID Error:", error.message);
    res.status(500).json({ message: "Failed to fetch business" });
  }
};

// ✅ Get nearby businesses
export const getNearbyBusinesses = async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res
        .status(400)
        .json({ message: "User coordinates are required and must be valid" });
    }

    const businesses = await Business.find({});

    const businessesWithDistance = businesses
      .map((business) => {
        const distance = haversineDistance(
          userLat,
          userLng,
          business.location.lat,
          business.location.lng,
        );
        return {
          ...business._doc,
          distance: parseFloat(distance.toFixed(2)),
        };
      })
      .sort((a, b) => a.distance - b.distance); // Closest first

    res.status(200).json(businessesWithDistance);
  } catch (error) {
    console.error("Nearby Fetch Error:", error.message);
    res.status(500).json({ message: "Error fetching nearby businesses" });
  }
};
