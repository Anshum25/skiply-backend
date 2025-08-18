// models/Image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true }, // Cloudinary URL
  public_id: { type: String }, // Cloudinary public_id
  uploadedAt: { type: Date, default: Date.now },
  // Add other fields as needed (e.g. user, business, part, etc.)
});

module.exports = mongoose.model('Image', imageSchema);
