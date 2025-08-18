// controllers/uploadController.js
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const Image = require('../models/Image');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'skiply',
    });

    // Optionally, remove local file after upload
    fs.unlinkSync(req.file.path);

    // Save the Cloudinary URL to MongoDB
    const imageDoc = await Image.create({
      url: result.secure_url,
      public_id: result.public_id,
    });

    return res.status(200).json(imageDoc);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ message: 'Image upload failed', error });
  }
};
