// src/pages/MyBookings.js
import React, { useState, useEffect } from 'react';
import { getUserBookings, cancelBooking, downloadTicket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await getUserBookings(user.id);
      setBookings(res.data.bookings);
    } catch {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(id);
      toast.success('Booking cancelled.');
      fetchBookings(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  const handleDownload = async (booking_id) => {
    try {
      const res = await downloadTicket(booking_id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket_${booking_id}.pdf`;
      a.click();
    } catch {
      toast.error('Download failed.');
    }
  };

  if (loading) return <div className="loading">Loading your bookings</div>;

  return (
    <div className="page-container">
      <h2 className="page-title">My Bookings</h2>

      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
          <p style={{ color: '#718096' }}>No bookings yet. <a href="/search" style={{ color: '#1a56db' }}>Search for tickets</a></p>
        </div>
      ) : (
        bookings.map(b => (
          <div className="vehicle-card" key={b.booking_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`badge badge-${b.vehicle_type}`}>
                  {b.vehicle_type === 'bus' ? '🚌' : '🚂'} {b.vehicle_type}
                </span>
                <div className="vehicle-name" style={{ marginTop: '0.4rem' }}>{b.vehicle_name}</div>
                <div style={{ color: '#718096', fontSize: '0.9rem', margin: '0.3rem 0' }}>
                  {b.source} → {b.destination} | {new Date(b.date).toDateString()}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#4a5568' }}>
                  Passenger: <strong>{b.passenger_name}</strong> (Age: {b.passenger_age}) |
                  Seat: <strong>{b.seat_number}</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.3rem' }}>
                  Booking ID: #{b.booking_id} | Booked: {new Date(b.booking_date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="vehicle-price" style={{ marginBottom: '0.5rem' }}>₹{parseFloat(b.price).toFixed(0)}</div>
                <span className={`status-${b.payment_status}`}>{b.payment_status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {b.payment_status !== 'cancelled' && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => handleDownload(b.booking_id)}>
                    📄 Download Ticket
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.booking_id)}>
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyBookings;
