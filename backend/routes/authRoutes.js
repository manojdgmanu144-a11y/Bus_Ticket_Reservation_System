// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/register  → Register new user
router.post('/register', register);

// POST /api/auth/login  → Login and get JWT
router.post('/login', login);

// GET /api/auth/profile  → Get logged-in user's profile (protected)
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
