// controllers/bookingController.js
// ============================================================
// Booking Controller - MOST IMPORTANT MODULE
//
// Data Flow when user books a ticket:
// 1. Frontend sends POST /api/bookings with seat + passenger info
// 2. authMiddleware verifies JWT token → req.user set
// 3. createBooking() checks seat availability
// 4. MySQL transaction: INSERT booking + UPDATE available_seats (atomic)
// 5. Response with booking ID sent back
// 6. Frontend shows confirmation + ticket
// ============================================================

const db = require('../config/db');

// ----------------------------------------------------------
// CREATE BOOKING: POST /api/bookings
// Body: { vehicle_id, seat_number, passenger_name, passenger_age }
// This uses a MySQL TRANSACTION to ensure data integrity:
//   - If INSERT fails → available_seats not decremented
//   - If UPDATE fails → booking not created
// Both succeed or both fail (atomicity)
// ----------------------------------------------------------
const createBooking = async (req, res) => {
  const { vehicle_id, seat_number, passenger_name, passenger_age } = req.body;
  const user_id = req.user.id; // Comes from JWT via authMiddleware

  if (!vehicle_id || !seat_number || !passenger_name || !passenger_age) {
    return res.status(400).json({ message: 'All booking fields are required.' });
  }

  // Get a dedicated connection for transaction
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Step 1: Check if this specific seat is already booked (lock row to prevent race conditions)
    const [seatCheck] = await conn.query(
      'SELECT booking_id FROM bookings WHERE vehicle_id = ? AND seat_number = ? AND payment_status != "cancelled" FOR UPDATE',
      [vehicle_id, seat_number]
    );

    if (seatCheck.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: `Seat ${seat_number} is already booked. Please choose another.` });
    }

    // Step 2: Check vehicle has available seats
    const [vehicleRows] = await conn.query(
      'SELECT available_seats, price, vehicle_name FROM vehicles WHERE id = ? FOR UPDATE',
      [vehicle_id]
    );

    if (vehicleRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    if (vehicleRows[0].available_seats <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'No seats available on this vehicle.' });
    }

    // Step 3: INSERT into bookings table
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (user_id, vehicle_id, seat_number, passenger_name, passenger_age, payment_status)
       VALUES (?, ?, ?, ?, ?, 'completed')`,
      [user_id, vehicle_id, seat_number, passenger_name, passenger_age]
    );

    const booking_id = bookingResult.insertId;

    // Step 4: DECREMENT available_seats in vehicles table
    await conn.query(
      'UPDATE vehicles SET available_seats = available_seats - 1 WHERE id = ?',
      [vehicle_id]
    );

    // Step 5: Commit transaction (both steps succeeded)
    await conn.commit();

    res.status(201).json({
      message: 'Booking successful!',
      booking: {
        booking_id,
        user_id,
        vehicle_id,
        seat_number,
        passenger_name,
        passenger_age,
        payment_status: 'completed',
        vehicle_name: vehicleRows[0].vehicle_name,
        price: vehicleRows[0].price
      }
    });

  } catch (err) {
    // Something went wrong → rollback BOTH operations
    await conn.rollback();
    console.error('Booking error:', err);

    // Handle duplicate entry error gracefully
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'This seat was just booked by someone else. Please choose another.' });
    }

    res.status(500).json({ message: 'Booking failed. Please try again.' });
  } finally {
    conn.release(); // Always return connection to pool
  }
};

// ----------------------------------------------------------
// GET USER BOOKINGS: GET /api/bookings/user/:id
// Returns all bookings for a specific user with vehicle details
// ----------------------------------------------------------
const getUserBookings = async (req, res) => {
  // Users can only view their own bookings (unless admin)
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    // JOIN bookings with vehicles to get full details
    const [bookings] = await db.query(
      `SELECT 
        b.booking_id, b.seat_number, b.passenger_name, b.passenger_age,
        b.booking_date, b.payment_status,
        v.vehicle_name, v.vehicle_type, v.source, v.destination,
        v.departure_time, v.arrival_time, v.date, v.price
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [req.params.id]
    );

    res.json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ----------------------------------------------------------
// GET ALL BOOKINGS (Admin): GET /api/bookings
// ----------------------------------------------------------
const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT 
        b.booking_id, b.seat_number, b.passenger_name, b.passenger_age,
        b.booking_date, b.payment_status,
        u.name AS user_name, u.email AS user_email,
        v.vehicle_name, v.vehicle_type, v.source, v.destination,
        v.departure_time, v.date, v.price
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN vehicles v ON b.vehicle_id = v.id
       ORDER BY b.booking_date DESC`
    );

    res.json({ bookings });
  } catch (err) {
    console.error('Get all bookings error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ----------------------------------------------------------
// CANCEL BOOKING: PUT /api/bookings/:id/cancel
// Sets payment_status to 'cancelled' and restores the seat
// ----------------------------------------------------------
const cancelBooking = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Get booking details (verify ownership)
    const [rows] = await conn.query(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = rows[0];

    // Check ownership or admin
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (booking.payment_status === 'cancelled') {
      await conn.rollback();
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    // Update status to cancelled
    await conn.query(
      'UPDATE bookings SET payment_status = "cancelled" WHERE booking_id = ?',
      [req.params.id]
    );

    // Restore the available seat
    await conn.query(
      'UPDATE vehicles SET available_seats = available_seats + 1 WHERE id = ?',
      [booking.vehicle_id]
    );

    await conn.commit();
    res.json({ message: 'Booking cancelled successfully.' });

  } catch (err) {
    await conn.rollback();
    console.error('Cancel booking error:', err);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    conn.release();
  }
};

// ----------------------------------------------------------
// ADMIN STATS: GET /api/bookings/stats
// For admin dashboard
// ----------------------------------------------------------
const getStats = async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users WHERE role = "user"');
    const [[{ total_bookings }]] = await db.query('SELECT COUNT(*) as total_bookings FROM bookings WHERE payment_status = "completed"');
    const [[{ revenue }]] = await db.query(
      `SELECT COALESCE(SUM(v.price), 0) as revenue 
       FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id 
       WHERE b.payment_status = "completed"`
    );
    const [[{ total_vehicles }]] = await db.query('SELECT COUNT(*) as total_vehicles FROM vehicles');

    // Monthly booking data for chart (last 6 months)
    const [monthly] = await db.query(
      `SELECT DATE_FORMAT(booking_date, '%b %Y') as month, COUNT(*) as count
       FROM bookings 
       WHERE payment_status = 'completed' AND booking_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY booking_date ASC`
    );

    res.json({ total_users, total_bookings, revenue, total_vehicles, monthly });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createBooking, getUserBookings, getAllBookings, cancelBooking, getStats };
