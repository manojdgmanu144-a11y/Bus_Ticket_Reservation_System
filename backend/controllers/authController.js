// controllers/authController.js
// ============================================================
// Authentication Controller
// Handles: Register, Login, Get Profile
// Data Flow:
//   Frontend sends JSON → Express parses body → Controller
//   validates → bcrypt hashes password → MySQL INSERT →
//   JWT token generated → token sent back to frontend
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// ----------------------------------------------------------
// REGISTER: POST /api/auth/register
// Body: { name, email, phone, password }
// ----------------------------------------------------------
const register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Hash password with bcrypt (salt rounds = 10)
    // bcrypt adds random salt so same password = different hash each time
    const hashedPassword = await bcrypt.hash(password, 10);

    // INSERT into MySQL users table
    // Using parameterized queries (?) prevents SQL injection
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, hashedPassword, 'user']
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, email, role: 'user' }, // Payload
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: result.insertId, name, email, role: 'user' }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ----------------------------------------------------------
// LOGIN: POST /api/auth/login
// Body: { email, password }
// ----------------------------------------------------------
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Fetch user from MySQL by email
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token valid for 7 days
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ----------------------------------------------------------
// GET PROFILE: GET /api/auth/profile (protected)
// Requires: Authorization: Bearer <token>
// ----------------------------------------------------------
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, getProfile };
