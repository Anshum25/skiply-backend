// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded JWT:', decoded);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      return res.status(401).json({ message: 'Invalid JWT token' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

// Middleware to allow only business role
export const businessOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'business') {
    return res.status(403).json({ message: 'Access denied: Business users only' });
  }
  next();
};

// Optional: Middleware for admin-only access (future use)
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};
