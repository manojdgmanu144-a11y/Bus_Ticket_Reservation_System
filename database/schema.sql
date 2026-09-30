-- ============================================================
-- Bus/Train Ticket Reservation System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS ticket_reservation;
USE ticket_reservation;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password VARCHAR(255) NOT NULL,        -- bcrypt hashed
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. VEHICLES TABLE (Buses & Trains)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type ENUM('bus', 'train') NOT NULL,
  vehicle_name VARCHAR(100) NOT NULL,
  source VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  total_seats INT NOT NULL DEFAULT 40,
  available_seats INT NOT NULL DEFAULT 40,
  price DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. BOOKINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  passenger_name VARCHAR(100) NOT NULL,
  passenger_age INT NOT NULL,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_seat (vehicle_id, seat_number)  -- Prevent duplicate seat booking
);

-- ============================================================
-- SAMPLE DATA INSERTION
-- ============================================================

-- Admin user (password: admin123)
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin User', 'admin@ticketapp.com', '9999999999',
 '$2b$10$rQ9K3z5Y8v1X2w4E6u0MnObLp7T3Hs9Jc5Ke2Ni8Mn4Pq1Rs6Tu', 'admin');

-- Sample regular user (password: user123)
INSERT INTO users (name, email, phone, password, role) VALUES
('John Doe', 'john@example.com', '9876543210',
 '$2b$10$rQ9K3z5Y8v1X2w4E6u0MnObLp7T3Hs9Jc5Ke2Ni8Mn4Pq1Rs6Tu', 'user');

-- Sample Vehicles
INSERT INTO vehicles (vehicle_type, vehicle_name, source, destination, departure_time, arrival_time, total_seats, available_seats, price, date) VALUES
('bus',   'Express Travels',  'Mumbai',    'Pune',      '06:00:00', '09:00:00', 40, 40, 350.00,  '2025-08-01'),
('bus',   'Royal Cruiser',    'Delhi',     'Agra',      '07:30:00', '11:30:00', 45, 45, 420.00,  '2025-08-01'),
('train', 'Rajdhani Express', 'Mumbai',    'Delhi',     '16:00:00', '08:00:00', 60, 60, 1200.00, '2025-08-01'),
('train', 'Shatabdi Express', 'Chennai',   'Bangalore', '06:00:00', '11:00:00', 50, 50, 800.00,  '2025-08-02'),
('bus',   'Volvo AC Sleeper', 'Hyderabad', 'Goa',       '20:00:00', '10:00:00', 36, 36, 950.00,  '2025-08-03'),
('train', 'Duronto Express',  'Kolkata',   'Delhi',     '08:00:00', '22:00:00', 72, 72, 1500.00, '2025-08-03');

-- ============================================================
-- STORED PROCEDURE: Book a seat (atomic operation)
-- ============================================================
DELIMITER //
CREATE PROCEDURE BookSeat(
  IN p_user_id INT,
  IN p_vehicle_id INT,
  IN p_seat_number VARCHAR(10),
  IN p_passenger_name VARCHAR(100),
  IN p_passenger_age INT,
  OUT p_booking_id INT,
  OUT p_status VARCHAR(50)
)
BEGIN
  DECLARE v_available INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_status = 'ERROR';
  END;

  START TRANSACTION;

  -- Check available seats (lock the row)
  SELECT available_seats INTO v_available FROM vehicles WHERE id = p_vehicle_id FOR UPDATE;

  IF v_available <= 0 THEN
    SET p_status = 'NO_SEATS';
    ROLLBACK;
  ELSE
    -- Insert booking
    INSERT INTO bookings (user_id, vehicle_id, seat_number, passenger_name, passenger_age, payment_status)
    VALUES (p_user_id, p_vehicle_id, p_seat_number, p_passenger_name, p_passenger_age, 'completed');

    SET p_booking_id = LAST_INSERT_ID();

    -- Decrement available seats
    UPDATE vehicles SET available_seats = available_seats - 1 WHERE id = p_vehicle_id;

    SET p_status = 'SUCCESS';
    COMMIT;
  END IF;
END //
DELIMITER ;
