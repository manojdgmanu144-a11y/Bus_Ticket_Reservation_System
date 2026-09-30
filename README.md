# 🎫 TicketEase - Bus & Train Ticket Reservation System

A full-stack ticket booking system with React frontend, Node.js/Express backend, and MySQL database.

---

## 📁 Project Structure

```
ticket-reservation/
├── frontend/                   # React.js Frontend
│   └── src/
│       ├── App.js              # Routes setup
│       ├── index.css           # Global styles
│       ├── components/
│       │   └── Navbar.js       # Navigation bar
│       ├── pages/
│       │   ├── Home.js         # Home + search form
│       │   ├── Login.js        # Login page
│       │   ├── Register.js     # Register page
│       │   ├── Search.js       # Search results
│       │   ├── BookTicket.js   # Seat selection + booking
│       │   ├── MyBookings.js   # User's booking history
│       │   └── AdminDashboard.js # Admin panel
│       ├── services/
│       │   └── api.js          # Axios HTTP calls to backend
│       └── context/
│           └── AuthContext.js  # Global auth state (JWT)
│
├── backend/                    # Node.js + Express Backend
│   ├── server.js               # App entry point
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/...
│   │   ├── vehicleRoutes.js    # /api/vehicles/...
│   │   └── bookingRoutes.js    # /api/bookings/...
│   ├── controllers/
│   │   ├── authController.js   # Register, Login logic
│   │   ├── vehicleController.js # CRUD for vehicles
│   │   ├── bookingController.js # Booking + seat management
│   │   └── ticketController.js # PDF generation
│   └── middleware/
│       └── auth.js             # JWT verification middleware
│
└── database/
    └── schema.sql              # Complete DB schema + sample data
```

---

## 🚀 Setup Guide (Step by Step)

### Prerequisites
- Node.js v18+ installed
- XAMPP installed (for MySQL)
- VS Code (recommended)

---

### Step 1: Start XAMPP MySQL

1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL**
3. Open **phpMyAdmin**: http://localhost/phpmyadmin

---

### Step 2: Create the Database

1. In phpMyAdmin, click **"New"** to create a database named `ticket_reservation`
2. Click on the database, then click **"SQL"** tab
3. Copy & paste the contents of `database/schema.sql`
4. Click **Go** to run it
5. You should see tables: `users`, `vehicles`, `bookings`

---

### Step 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env (if your MySQL has a password, set DB_PASSWORD)
# Default XAMPP MySQL: user=root, password=(empty)

# Start the backend server
npm run dev
```

Backend will run at: **http://localhost:5000**

Test it: Open http://localhost:5000 — you should see:
```json
{ "message": "🚀 Ticket Reservation API is running!" }
```

---

### Step 4: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the React app
npm start
```

Frontend will run at: **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | admin@ticketapp.com    | admin123 |
| User  | john@example.com       | user123  |

> ⚠️ Note: The sample data passwords in schema.sql are placeholder hashes.
> For the demo credentials to work, run this SQL to reset them:
> ```sql
> -- admin123 hash
> UPDATE users SET password='$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email='admin@ticketapp.com';
> -- user123 hash  
> UPDATE users SET password='$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email='john@example.com';
> ```

---

## 🌐 API Reference

### Authentication

| Method | Endpoint              | Description           | Auth Required |
|--------|-----------------------|-----------------------|---------------|
| POST   | /api/auth/register    | Register new user     | No            |
| POST   | /api/auth/login       | Login + get JWT       | No            |
| GET    | /api/auth/profile     | Get current user      | Yes           |

### Vehicles

| Method | Endpoint              | Description           | Auth Required |
|--------|-----------------------|-----------------------|---------------|
| GET    | /api/vehicles         | Search vehicles       | No            |
| GET    | /api/vehicles/:id     | Get vehicle + seats   | No            |
| GET    | /api/vehicles/all     | All vehicles          | Admin         |
| POST   | /api/vehicles         | Add vehicle           | Admin         |
| PUT    | /api/vehicles/:id     | Update vehicle        | Admin         |
| DELETE | /api/vehicles/:id     | Delete vehicle        | Admin         |

### Bookings

| Method | Endpoint                     | Description         | Auth Required |
|--------|------------------------------|---------------------|---------------|
| POST   | /api/bookings                | Create booking      | Yes           |
| GET    | /api/bookings/user/:id       | User's bookings     | Yes           |
| GET    | /api/bookings                | All bookings        | Admin         |
| PUT    | /api/bookings/:id/cancel     | Cancel booking      | Yes           |
| GET    | /api/bookings/ticket/:id     | Download PDF ticket | Yes           |
| GET    | /api/bookings/stats          | Dashboard stats     | Admin         |

---

## 🔄 Data Flow Explanation

### Registration Flow
```
User fills form → React validates → axios.post('/api/auth/register')
→ Express router → authController.register()
→ bcrypt.hash(password, 10) → INSERT INTO users
→ jwt.sign({ id, email, role }) → token returned
→ Frontend saves token in localStorage → user redirected
```

### Booking Flow (Most Important)
```
User selects seat → fills passenger details → clicks "Pay & Book"
→ axios.post('/api/bookings', { vehicle_id, seat_number, passenger_name, passenger_age })
  Authorization: Bearer <JWT token>

→ authMiddleware verifies token → req.user = { id, email, role }
→ bookingController.createBooking()
→ BEGIN TRANSACTION
  → SELECT seat FROM bookings WHERE vehicle_id=? AND seat_number=? FOR UPDATE
  → IF seat taken → ROLLBACK → 409 Conflict
  → SELECT available_seats FROM vehicles WHERE id=? FOR UPDATE
  → IF no seats → ROLLBACK → 400 error
  → INSERT INTO bookings (user_id, vehicle_id, seat_number, ...)
  → UPDATE vehicles SET available_seats = available_seats - 1
→ COMMIT
→ { booking_id, seat_number, ... } returned to frontend
→ Frontend shows success screen with PDF download button
```

### Why We Use MySQL Transactions
- **Atomicity**: Both INSERT booking AND UPDATE seats either both succeed or both fail
- **Isolation**: `FOR UPDATE` lock prevents two users booking the same seat simultaneously
- **No dirty reads**: Even under high concurrency, each seat is booked exactly once

---

## 🗄️ Database Schema

```
users
  id (PK) | name | email (UNIQUE) | phone | password (bcrypt) | role | created_at

vehicles
  id (PK) | vehicle_type | vehicle_name | source | destination |
  departure_time | arrival_time | total_seats | available_seats | price | date

bookings
  booking_id (PK) | user_id (FK→users) | vehicle_id (FK→vehicles) |
  seat_number | passenger_name | passenger_age | booking_date | payment_status
  UNIQUE(vehicle_id, seat_number)  ← prevents duplicate seat booking at DB level
```

---

## 🛠️ Tech Stack

| Layer     | Technology        |
|-----------|-------------------|
| Frontend  | React 18, React Router, Axios, Recharts |
| Backend   | Node.js, Express.js |
| Database  | MySQL (via XAMPP) |
| Auth      | JWT + bcryptjs    |
| PDF       | PDFKit            |
| Styling   | Custom CSS (no framework needed) |

---

## 🐛 Troubleshooting

**"Cannot connect to database"**
→ Make sure XAMPP MySQL is running. Check `.env` DB credentials.

**"Cannot GET /api/..."**
→ Backend not running. Run `npm run dev` in `/backend/`.

**React app shows blank page**
→ Make sure backend is running first. Check browser console for errors.

**PDF download not working**
→ Check that `pdfkit` is installed: `npm install pdfkit` in `/backend/`.
