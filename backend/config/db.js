// config/db.js
// ============================================================
// MySQL Database Connection using mysql2 + connection pooling
// Connection pool is preferred over single connection because:
// - It reuses connections (faster)
// - Handles concurrent requests
// - Automatically reconnects on failure
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a pool of MySQL connections
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ticket_reservation',
  waitForConnections: true,   // Wait if all connections are busy
  connectionLimit: 10,        // Max 10 simultaneous connections
  queueLimit: 0               // Unlimited queue
});

// Test the connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Database connected successfully');
    conn.release(); // Return connection to pool
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Make sure XAMPP MySQL is running and the database exists.');
    process.exit(1);
  });

module.exports = pool;
