import express from 'express';
import { bookQueue, getUserBookings, updateBookingStatus, getBusinessBookings } from '../controllers/queueController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/book', protect, bookQueue);
router.get('/my-bookings', protect, getUserBookings);
router.patch('/:id/status', protect, businessOnly, updateBookingStatus);

// Get all bookings for a specific business
router.get('/business/:businessId', protect, businessOnly, getBusinessBookings);

export default router;
