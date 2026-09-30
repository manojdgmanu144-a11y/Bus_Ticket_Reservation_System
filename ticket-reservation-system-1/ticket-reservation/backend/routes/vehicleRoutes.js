// routes/vehicleRoutes.js
const express = require('express');
const router = express.Router();
const {
  searchVehicles, getVehicleById, addVehicle,
  updateVehicle, deleteVehicle, getAllVehicles
} = require('../controllers/vehicleController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/vehicles?source=&destination=&date=&vehicle_type=  → Public search
router.get('/', searchVehicles);

// GET /api/vehicles/all  → Admin: get all vehicles (protected)
router.get('/all', authMiddleware, adminMiddleware, getAllVehicles);

// GET /api/vehicles/:id  → Get vehicle + booked seats
router.get('/:id', getVehicleById);

// POST /api/vehicles  → Admin: add vehicle (protected)
router.post('/', authMiddleware, adminMiddleware, addVehicle);

// PUT /api/vehicles/:id  → Admin: update vehicle (protected)
router.put('/:id', authMiddleware, adminMiddleware, updateVehicle);

// DELETE /api/vehicles/:id  → Admin: delete vehicle (protected)
router.delete('/:id', authMiddleware, adminMiddleware, deleteVehicle);

module.exports = router;
