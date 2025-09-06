import express from 'express';
import { bookQueue, getUserBookings, updateBookingStatus, getBusinessBookings, getNextToken, getQueueStatus, getBusinessQueueMetrics } from '../controllers/queueController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/book', protect, bookQueue);
router.get('/my-bookings', protect, getUserBookings);
router.patch('/:id/status', protect, businessOnly, updateBookingStatus);

// Get all bookings for a specific business
router.get('/business/:businessId', protect, businessOnly, getBusinessBookings);

// Preview next token for a business + department for today
router.get('/next-token', protect, getNextToken);

// Get live queue status for a booking
router.get('/status/:id', protect, getQueueStatus);

// Public business-level queue metrics (live counts and avg wait)
router.get('/metrics/:businessId', getBusinessQueueMetrics);

export default router;
