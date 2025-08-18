// models/Business.js
import mongoose from "mongoose";

// Reusable schema for each day's opening hours
const daySchema = new mongoose.Schema(
  {
    start: {
      type: String,
      default: "09:00",
    },
    end: {
      type: String,
      default: "18:00",
    },
    closed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

// Main Business Schema
const businessSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    departments: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    images: {
      type: [String], // Array of image URLs or filenames
      default: [],
    },
    openingHours: {
      monday: daySchema,
      tuesday: daySchema,
      wednesday: daySchema,
      thursday: daySchema,
      friday: daySchema,
      saturday: daySchema,
      sunday: daySchema,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Business", businessSchema);
