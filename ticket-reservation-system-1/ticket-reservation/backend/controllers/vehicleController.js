// controllers/vehicleController.js
// ============================================================
// Vehicle (Bus/Train) Controller
// Handles: Search, CRUD for admin
// ============================================================

const db = require('../config/db');

// ----------------------------------------------------------
// SEARCH VEHICLES: GET /api/vehicles
// Query params: source, destination, date, vehicle_type
// ----------------------------------------------------------
const searchVehicles = async (req, res) => {
  const { source, destination, date, vehicle_type } = req.query;

  // Build dynamic WHERE clause based on provided filters
  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];

  if (source) {
    query += ' AND source LIKE ?';
    params.push(`%${source}%`);
  }
  if (destination) {
    query += ' AND destination LIKE ?';
    params.push(`%${destination}%`);
  }
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  if (vehicle_type) {
    query += ' AND vehicle_type = ?';
    params.push(vehicle_type);
  }

  query += ' ORDER BY departure_time ASC';

  try {
    const [vehicles] = await db.query(query, params);
    res.json({ vehicles, count: vehicles.length });
  } catch (err) {
    console.error('Search vehicles error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ----------------------------------------------------------
// GET SINGLE VEHICLE: GET /api/vehicles/:id
// Also returns booked seats for seat map display
// ----------------------------------------------------------
const getVehicleById = async (req, res) => {
  try {
    const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);

    if (vehicles.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    // Get all booked seat numbers for this vehicle
    const [bookedSeats] = await db.query(
      'SELECT seat_number FROM bookings WHERE vehicle_id = ? AND payment_status != "cancelled"',
      [req.params.id]
    );

    res.json({
      vehicle: vehicles[0],
      bookedSeats: bookedSeats.map(b => b.seat_number)
    });
  } catch (err) {
    console.error('Get vehicle error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ----------------------------------------------------------
// ADD VEHICLE (Admin): POST /api/vehicles
// ----------------------------------------------------------
const addVehicle = async (req, res) => {
  const { vehicle_type, vehicle_name, source, destination,
          departure_time, arrival_time, total_seats, price, date } = req.body;

  if (!vehicle_type || !vehicle_name || !source || !destination ||
      !departure_time || !arrival_time || !total_seats || !price || !date) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO vehicles 
        (vehicle_type, vehicle_name, source, destination, departure_time, arrival_time, total_seats, available_seats, price, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicle_type, vehicle_name, source, destination, departure_time, arrival_time,
       total_seats, total_seats, price, date] // available_seats = total_seats initially
    );

    res.status(201).json({ message: 'Vehicle added successfully.', id: result.insertId });
  } catch (err) {
    console.error('Add vehicle error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ----------------------------------------------------------
// UPDATE VEHICLE (Admin): PUT /api/vehicles/:id
// ----------------------------------------------------------
const updateVehicle = async (req, res) => {
  const { vehicle_type, vehicle_name, source, destination,
          departure_time, arrival_time, total_seats, price, date } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE vehicles SET 
        vehicle_type=?, vehicle_name=?, source=?, destination=?,
        departure_time=?, arrival_time=?, total_seats=?, price=?, date=?
       WHERE id=?`,
      [vehicle_type, vehicle_name, source, destination,
       departure_time, arrival_time, total_seats, price, date, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    res.json({ message: 'Vehicle updated successfully.' });
  } catch (err) {
    console.error('Update vehicle error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ----------------------------------------------------------
// DELETE VEHICLE (Admin): DELETE /api/vehicles/:id
// ----------------------------------------------------------
const deleteVehicle = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    res.json({ message: 'Vehicle deleted successfully.' });
  } catch (err) {
    console.error('Delete vehicle error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ----------------------------------------------------------
// GET ALL VEHICLES (Admin dashboard)
// ----------------------------------------------------------
const getAllVehicles = async (req, res) => {
  try {
    const [vehicles] = await db.query('SELECT * FROM vehicles ORDER BY date, departure_time');
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { searchVehicles, getVehicleById, addVehicle, updateVehicle, deleteVehicle, getAllVehicles };
