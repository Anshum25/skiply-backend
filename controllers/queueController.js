import Booking from '../models/Booking.js';
import Business from '../models/Business.js';
import { generateQrCodeString } from '../utils/qr.js';
import mongoose from 'mongoose';

export const bookQueue = async (req, res) => {
  try {
    console.log("Booking payload received:", req.body);
    console.log("User making request:", req.user);
    
    // Extract businessId from either 'business' or 'businessId' field
    const { business, businessId, businessName, departmentName, customerName, customerPhone, notes, bookedAt } = req.body;
    
    // Use whichever field contains the business ID
    const actualBusinessId = businessId || business;
    
    console.log("Actual business ID:", actualBusinessId);
    console.log("Business ID type:", typeof actualBusinessId);
    
    if (!actualBusinessId) {
      console.error("Missing business ID");
      return res.status(400).json({ message: "Business ID is required" });
    }
    
    if (!businessName) {
      console.error("Missing business name");
      return res.status(400).json({ message: "Business name is required" });
    }
    
    if (!departmentName || !customerName || !customerPhone) {
      console.error("Missing required fields:", { departmentName, customerName, customerPhone });
      return res.status(400).json({ message: "Missing required booking details: departmentName, customerName, or customerPhone" });
    }

    // Check if businessId is a valid ObjectId, if not, try to find the business by name
    let businessObjectId;
    if (mongoose.Types.ObjectId.isValid(actualBusinessId)) {
      businessObjectId = new mongoose.Types.ObjectId(actualBusinessId);
    } else {
      console.log("Business ID is not a valid ObjectId, trying to find business by name");
      // Try to find business by businessName as fallback
      const foundBusiness = await Business.findOne({ businessName: businessName });
      if (foundBusiness) {
        businessObjectId = foundBusiness._id;
        console.log("Found business by name:", foundBusiness._id);
      } else {
        console.error("Could not find business by name:", businessName);
        return res.status(400).json({ message: "Invalid business ID and could not find business by name" });
      }
    }

    console.log("Creating booking with businessId:", businessObjectId);

    // Determine today's date range for token numbering (per day)
    const now = bookedAt ? new Date(bookedAt) : new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Count existing bookings for same business + department today to assign next token
    const todayCount = await Booking.countDocuments({
      business: businessObjectId,
      departmentName: departmentName,
      bookedAt: { $gte: startOfDay, $lte: endOfDay },
    });
    const nextToken = todayCount + 1;

    const booking = await Booking.create({
      user: req.user._id,
      business: businessObjectId,
      businessId: actualBusinessId,
      businessName,
      departmentName,
      tokenNumber: nextToken,
      customerName,
      customerPhone,
      notes: notes || '',
      bookedAt: now,
      status: 'pending',
      qrCode: generateQrCodeString(),
    });

    console.log("Booking created successfully:", booking);
    res.status(201).json(booking);
    
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ 
      message: "Failed to create booking", 
      error: error.message 
    });
  }
};

// Public metrics: live queue counts and estimated average wait for a business (today)
export const getBusinessQueueMetrics = async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId) return res.status(400).json({ message: 'Business ID is required' });

    let businessObjectId;
    if (mongoose.Types.ObjectId.isValid(businessId)) {
      businessObjectId = new mongoose.Types.ObjectId(businessId);
    } else {
      // Try by businessName as fallback
      const byName = await Business.findOne({ businessName: businessId });
      if (byName) businessObjectId = byName._id;
    }
    if (!businessObjectId) return res.status(400).json({ message: 'Invalid business ID' });

    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(now); endOfDay.setHours(23,59,59,999);

    // Get today's bookings for this business that are not cancelled/completed
    const todays = await Booking.find({
      business: businessObjectId,
      bookedAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'completed'] },
    }).select('departmentName tokenNumber status');

    const totalInQueue = todays.length;
    // naive average: 5 min per person currently in queue
    const avgWaitMinutes = Math.round(totalInQueue * 5);

    // per-department counts
    const perDepartment = {};
    todays.forEach(b => {
      perDepartment[b.departmentName] = (perDepartment[b.departmentName] || 0) + 1;
    });

    res.json({ totalInQueue, avgWaitMinutes, perDepartment });
  } catch (error) {
    console.error('Error getting business queue metrics:', error);
    res.status(500).json({ message: 'Failed to get business metrics', error: error.message });
  }
};

// Preview next token number for a business + department for today
export const getNextToken = async (req, res) => {
  try {
    const { businessId, businessName, departmentName, date } = req.query;
    if (!departmentName) {
      return res.status(400).json({ message: 'departmentName is required' });
    }

    let businessObjectId;
    const actualBusinessId = businessId;
    if (actualBusinessId && mongoose.Types.ObjectId.isValid(actualBusinessId)) {
      businessObjectId = new mongoose.Types.ObjectId(actualBusinessId);
    } else if (businessName) {
      const foundBusiness = await Business.findOne({ businessName: businessName });
      if (foundBusiness) businessObjectId = foundBusiness._id;
    }

    if (!businessObjectId) {
      return res.status(400).json({ message: 'Valid businessId or businessName is required' });
    }

    const now = date ? new Date(date) : new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(now); endOfDay.setHours(23,59,59,999);

    const todayCount = await Booking.countDocuments({
      business: businessObjectId,
      departmentName,
      bookedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    return res.json({ tokenNumber: todayCount + 1 });
  } catch (error) {
    console.error('Error getting next token:', error);
    res.status(500).json({ message: 'Failed to get next token', error: error.message });
  }
};

// Get live queue status for a booking (people ahead and estimated wait)
export const getQueueStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Same-day context
    const now = new Date(booking.bookedAt || Date.now());
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(now); endOfDay.setHours(23,59,59,999);

    // Count bookings with lower tokenNumber that are not completed
    const peopleAhead = await Booking.countDocuments({
      business: booking.business,
      departmentName: booking.departmentName,
      bookedAt: { $gte: startOfDay, $lte: endOfDay },
      tokenNumber: { $lt: booking.tokenNumber },
      status: { $ne: 'completed' },
    });

    // Basic estimate: 5 minutes per person ahead
    const estimatedWaitTime = peopleAhead * 5;

    res.json({
      peopleAhead,
      estimatedWaitTime,
      tokenNumber: booking.tokenNumber,
      status: booking.status,
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ message: 'Failed to get queue status', error: error.message });
  }
};
  // Get all bookings for a specific business
  export const getBusinessBookings = async (req, res) => {
    try {
      const businessId = req.params.businessId;
      if (!businessId) {
        return res.status(400).json({ message: 'Business ID is required' });
      }
      const bookings = await Booking.find({ business: businessId }).populate('user');
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching business bookings:', error);
      res.status(500).json({ message: 'Failed to fetch business bookings', error: error.message });
    }
  };

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('business'); // Use 'business' field
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ 
      message: "Failed to fetch bookings", 
      error: error.message 
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = req.body.status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ 
      message: "Failed to update booking status", 
      error: error.message 
    });
  }
};