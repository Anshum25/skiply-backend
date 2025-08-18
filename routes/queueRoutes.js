import express from 'express';
import { bookQueue, getUserBookings, updateBookingStatus } from '../controllers/queueController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/book', protect, bookQueue);
router.get('/my-bookings', protect, getUserBookings);
router.patch('/:id/status', protect, businessOnly, updateBookingStatus);

export default router;
