// backend/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer
const upload = multer({ dest: 'uploads/' });

// Serve uploaded files statically
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Handle upload POST request
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = `/uploads/${req.file.filename}`;
  const fileUrl = `http://localhost:5050${filePath}`;

  res.json({ url: fileUrl });
});

module.exports = router;
