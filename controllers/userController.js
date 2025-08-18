import User from "../models/User.js";

export const getProfile = async (req, res) => {
  res.json(req.user);
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
