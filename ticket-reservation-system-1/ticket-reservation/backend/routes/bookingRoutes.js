// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const {
  createBooking, getUserBookings, getAllBookings, cancelBooking, getStats
} = require('../controllers/bookingController');
const { generateTicket } = require('../controllers/ticketController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// POST /api/bookings  → Create booking (protected)
router.post('/', authMiddleware, createBooking);

// GET /api/bookings/stats  → Admin dashboard stats (protected admin)
router.get('/stats', authMiddleware, adminMiddleware, getStats);

// GET /api/bookings  → Admin: get all bookings (protected admin)
router.get('/', authMiddleware, adminMiddleware, getAllBookings);

// GET /api/bookings/user/:id  → Get bookings for a specific user (protected)
router.get('/user/:id', authMiddleware, getUserBookings);

// PUT /api/bookings/:id/cancel  → Cancel booking (protected)
router.put('/:id/cancel', authMiddleware, cancelBooking);

// GET /api/tickets/:booking_id  → Download PDF ticket (protected)
router.get('/ticket/:booking_id', authMiddleware, generateTicket);

module.exports = router;
// Endpoint to perform a completely random booking
router.post('/api/bookings/random', (req, res) => {
    const { user_id, seat_number } = req.body; // Pass the logged-in user's ID

    // 1. First, find ONE completely random vehicle from your database
    const findRandomVehicleQuery = "SELECT id FROM vehicles ORDER BY RAND() LIMIT 1";

    db.query(findRandomVehicleQuery, (err, rows) => {
        if (err) return res.status(500).json({ error: "Could not find a vehicle" });
        if (rows.length === 0) return res.status(400).json({ error: "No vehicles available in the database" });

        const randomVehicleId = rows[0].id; // Extract the random vehicle's ID

        // 2. Insert this random vehicle into the bookings table
        const insertBookingQuery = "INSERT INTO bookings (user_id, vehicle_id, seat_number) VALUES (?, ?, ?)";
        
        db.query(insertBookingQuery, [user_id, randomVehicleId, seat_number || '12A'], (bookingErr, result) => {
            if (bookingErr) return res.status(500).json({ error: "Random booking failed to store" });

            res.status(200).json({
                success: true,
                message: "Successfully booked a random trip!",
                bookingId: result.insertId,
                vehicleId: randomVehicleId
            });
        });
    });
});