import User from "../models/User.js";

export const getProfile = async (req, res) => {
  res.json(req.user);
};

import path from 'path';
import fs from 'fs';

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    let { name, phone, location } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (location !== undefined) updateFields.location = location;

    // Handle profile image upload with Cloudinary
    if (req.file) {
      const cloudinary = require('../config/cloudinary');
      const streamifier = require('streamifier');
      const uploadFromBuffer = (fileBuffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'skiply/profile_images' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(fileBuffer).pipe(stream);
        });
      };
      try {
        const result = await uploadFromBuffer(req.file.buffer);
        updateFields.profileImage = result.secure_url;
      } catch (cloudErr) {
        return res.status(500).json({ message: 'Cloudinary upload failed', error: cloudErr });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
