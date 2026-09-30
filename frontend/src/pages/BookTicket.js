// src/pages/BookTicket.js
// ============================================================
// Booking Page - Seat Selection + Passenger Details
// Flow:
//   1. Fetch vehicle details + booked seats from backend
//   2. Display interactive seat map
//   3. User selects a seat
//   4. User fills passenger details
//   5. POST /api/bookings → Backend stores booking + updates seats
//   6. Show success with booking ID
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVehicleById, createBooking, downloadTicket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BookTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [vehicle, setVehicle]       = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [booking, setBooking]       = useState(null); // Confirmed booking result
  const [submitting, setSubmitting] = useState(false);
  const [passenger, setPassenger]   = useState({ name: '', age: '' });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast('Please login to book tickets', { icon: '🔒' });
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch vehicle + booked seats
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await getVehicleById(id);
        setVehicle(res.data.vehicle);
        setBookedSeats(res.data.bookedSeats); // Array of seat numbers already booked
      } catch {
        toast.error('Vehicle not found.');
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchVehicle();
  }, [id, isAuthenticated, navigate]);

  // Handle booking submission
  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSeat) return toast.error('Please select a seat first.');
    if (!passenger.name || !passenger.age) return toast.error('Please fill passenger details.');

    setSubmitting(true);
    try {
      // POST /api/bookings with seat + passenger info + JWT token (auto-attached by axios)
      const res = await createBooking({
        vehicle_id:     vehicle.id,
        seat_number:    selectedSeat,
        passenger_name: passenger.name,
        passenger_age:  parseInt(passenger.age),
      });

      setBooking(res.data.booking); // Store confirmed booking for display
      toast.success('Booking confirmed! 🎉');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';
      toast.error(msg);
      // Refresh booked seats in case someone else just booked
      if (err.response?.status === 409) {
        const res = await getVehicleById(id);
        setBookedSeats(res.data.bookedSeats);
        setSelectedSeat(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Download PDF ticket
  const handleDownload = async () => {
    try {
      const res = await downloadTicket(booking.booking_id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket_${booking.booking_id}.pdf`;
      a.click();
    } catch {
      toast.error('Failed to download ticket.');
    }
  };

  // Generate seat numbers: A1-A10, B1-B10, etc.
  const generateSeats = (total) => {
    const seats = [];
    const rows = ['A','B','C','D','E','F','G','H','I','J'];
    let count = 0;
    for (const row of rows) {
      for (let n = 1; n <= 10; n++) {
        if (count >= total) break;
        seats.push(`${row}${n}`);
        count++;
      }
      if (count >= total) break;
    }
    return seats;
  };

  if (loading) return <div className="loading">Loading vehicle details</div>;

  // ── Booking success screen ──────────────────────────────
  if (booking) {
    return (
      <div className="page-container" style={{ maxWidth: '600px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#276749', marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
          <p style={{ color: '#718096', marginBottom: '1.5rem' }}>Your ticket has been booked successfully.</p>

          <div style={{ background: '#f7fafc', borderRadius: '10px', padding: '1.2rem', textAlign: 'left', marginBottom: '1.5rem' }}>
            {[
              ['Booking ID', `#${booking.booking_id}`],
              ['Vehicle',    booking.vehicle_name],
              ['Seat',       booking.seat_number],
              ['Passenger',  booking.passenger_name],
              ['Age',        booking.passenger_age],
              ['Amount Paid', `₹${parseFloat(booking.price).toFixed(2)}`],
              ['Status',     '✅ Completed'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#718096', fontSize: '0.9rem' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-success" onClick={handleDownload}>
              📄 Download PDF Ticket
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/my-bookings')}>
              My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allSeats = generateSeats(vehicle.total_seats);

  return (
    <div className="page-container">
      <h2 className="page-title">Book Ticket</h2>

      {/* Vehicle Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className={`badge badge-${vehicle.vehicle_type}`}>{vehicle.vehicle_type.toUpperCase()}</span>
            <h3 style={{ marginTop: '0.4rem' }}>{vehicle.vehicle_name}</h3>
            <p style={{ color: '#718096' }}>
              {vehicle.source} → {vehicle.destination} | {new Date(vehicle.date).toDateString()}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a56db' }}>₹{parseFloat(vehicle.price).toFixed(0)}</div>
            <div style={{ fontSize: '0.85rem', color: '#718096' }}>{vehicle.available_seats} seats left</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Seat Map */}
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Select Seat</h4>
          <div style={{ textAlign: 'center', color: '#718096', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            🚌 Front
          </div>

          <div className="seat-grid">
            {allSeats.map(seat => {
              const isBooked   = bookedSeats.includes(seat);
              const isSelected = selectedSeat === seat;
              return (
                <div
                  key={seat}
                  className={`seat ${isBooked ? 'seat-booked' : ''} ${isSelected ? 'seat-selected' : ''}`}
                  onClick={() => !isBooked && setSelectedSeat(seat)}
                  title={isBooked ? 'Already booked' : `Seat ${seat}`}
                >
                  {seat}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="seat-legend">
            <div className="legend-item">
              <div className="legend-box" style={{ background: 'white', borderColor: '#cbd5e0' }}></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-box" style={{ background: '#1a56db', borderColor: '#1a56db' }}></div>
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <div className="legend-box" style={{ background: '#fed7d7', borderColor: '#fc8181' }}></div>
              <span>Booked</span>
            </div>
          </div>

          {selectedSeat && (
            <div className="success-box" style={{ textAlign: 'center', marginTop: '1rem' }}>
              Selected: <strong>Seat {selectedSeat}</strong>
            </div>
          )}
        </div>

        {/* Passenger Details */}
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Passenger Details</h4>

          <form onSubmit={handleBook}>
            <div className="form-group">
              <label>Passenger Name</label>
              <input type="text" placeholder="Full name"
                value={passenger.name}
                onChange={e => setPassenger(p => ({ ...p, name: e.target.value }))}
                required />
            </div>
            <div className="form-group">
              <label>Passenger Age</label>
              <input type="number" placeholder="Age" min="1" max="120"
                value={passenger.age}
                onChange={e => setPassenger(p => ({ ...p, age: e.target.value }))}
                required />
            </div>

            {/* Summary */}
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Seat</span><span>{selectedSeat || 'Not selected'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Price</span><span>₹{parseFloat(vehicle.price).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span><span style={{ color: '#1a56db' }}>₹{parseFloat(vehicle.price).toFixed(2)}</span>
              </div>
            </div>

            <button className="btn btn-primary" type="submit"
                    style={{ width: '100%', padding: '0.75rem' }}
                    disabled={submitting || !selectedSeat}>
              {submitting ? 'Processing...' : '💳 Pay & Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookTicket;
