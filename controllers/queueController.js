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
      // Try to find business by name as fallback
      const foundBusiness = await Business.findOne({ name: businessName });
      if (foundBusiness) {
        businessObjectId = foundBusiness._id;
        console.log("Found business by name:", foundBusiness._id);
      } else {
        console.error("Could not find business by name:", businessName);
        return res.status(400).json({ message: "Invalid business ID and could not find business by name" });
      }
    }

    console.log("Creating booking with businessId:", businessObjectId);

    const booking = await Booking.create({
      user: req.user._id,
      business: businessObjectId,
      businessId: actualBusinessId,
      businessName,
      departmentName,
      customerName,
      customerPhone,
      notes: notes || '',
      bookedAt: bookedAt ? new Date(bookedAt) : new Date(),
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