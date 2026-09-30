// middleware/auth.js
// ============================================================
// JWT Authentication Middleware
// This runs BEFORE route handlers to verify the user's token.
// Usage: Add `authMiddleware` to any protected route.
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT token from Authorization header
const authMiddleware = (req, res, next) => {
  // Get token from "Authorization: Bearer <token>" header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract after "Bearer "

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data { id, email, role } to request
    next(); // Continue to route handler
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Admin-only middleware (use AFTER authMiddleware)
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = { authMiddleware, adminMiddleware };
