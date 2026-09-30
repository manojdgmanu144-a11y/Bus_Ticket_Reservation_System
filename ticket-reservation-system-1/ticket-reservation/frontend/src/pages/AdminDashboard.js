// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { getAdminStats, getAllBookings, getAllVehicles, addVehicle, deleteVehicle } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const emptyVehicle = {
  vehicle_type: 'bus', vehicle_name: '', source: '', destination: '',
  departure_time: '', arrival_time: '', total_seats: 40, price: '', date: ''
};

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const [tab, setTab]           = useState('overview');
  const [stats, setStats]       = useState(null);
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(emptyVehicle);
  const [adding, setAdding]     = useState(false);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, b, v] = await Promise.all([getAdminStats(), getAllBookings(), getAllVehicles()]);
      setStats(s.data);
      setBookings(b.data.bookings);
      setVehicles(v.data.vehicles);
    } catch { toast.error('Failed to load dashboard data.'); }
    finally { setLoading(false); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addVehicle(form);
      toast.success('Vehicle added!');
      setForm(emptyVehicle);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle.');
    } finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? All related bookings will also be deleted.')) return;
    try {
      await deleteVehicle(id);
      toast.success('Vehicle deleted.');
      fetchAll();
    } catch { toast.error('Delete failed.'); }
  };

  if (loading) return <div className="loading">Loading admin dashboard</div>;

  return (
    <div className="page-container">
      <h2 className="page-title">Admin Dashboard</h2>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {['overview', 'bookings', 'vehicles', 'add-vehicle'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTab(t)}>
            {t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────── */}
      {tab === 'overview' && stats && (
        <>
          <div className="stats-grid">
            {[
              { icon: '👥', val: stats.total_users,    label: 'Total Users' },
              { icon: '🎫', val: stats.total_bookings, label: 'Total Bookings' },
              { icon: '💰', val: `₹${parseFloat(stats.revenue).toFixed(0)}`, label: 'Revenue' },
              { icon: '🚌', val: stats.total_vehicles, label: 'Vehicles' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {stats.monthly?.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: '1rem' }}>Monthly Bookings</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a56db" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* ── BOOKINGS ──────────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>All Bookings ({bookings.length})</h4>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th><th>User</th><th>Vehicle</th>
                  <th>Route</th><th>Seat</th><th>Date</th><th>Status</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.booking_id}>
                    <td>#{b.booking_id}</td>
                    <td><strong>{b.user_name}</strong><br/><small style={{color:'#718096'}}>{b.user_email}</small></td>
                    <td>{b.vehicle_name}</td>
                    <td>{b.source} → {b.destination}</td>
                    <td>{b.seat_number}</td>
                    <td>{new Date(b.booking_date).toLocaleDateString()}</td>
                    <td><span className={`status-${b.payment_status}`}>{b.payment_status}</span></td>
                    <td>₹{parseFloat(b.price).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VEHICLES ──────────────────────────────────── */}
      {tab === 'vehicles' && (
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>All Vehicles ({vehicles.length})</h4>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Type</th><th>Name</th><th>Route</th>
                  <th>Date</th><th>Seats</th><th>Price</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td>#{v.id}</td>
                    <td><span className={`badge badge-${v.vehicle_type}`}>{v.vehicle_type}</span></td>
                    <td>{v.vehicle_name}</td>
                    <td>{v.source} → {v.destination}</td>
                    <td>{new Date(v.date).toLocaleDateString()}</td>
                    <td>{v.available_seats}/{v.total_seats}</td>
                    <td>₹{parseFloat(v.price).toFixed(0)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD VEHICLE ───────────────────────────────── */}
      {tab === 'add-vehicle' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h4 style={{ marginBottom: '1.2rem' }}>Add New Vehicle</h4>
          <form onSubmit={handleAddVehicle}>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.vehicle_type} onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))}>
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                </select>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="e.g., Express Travels" value={form.vehicle_name}
                  onChange={e => setForm(p => ({ ...p, vehicle_name: e.target.value }))} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Source</label>
                <input type="text" placeholder="From city" value={form.source}
                  onChange={e => setForm(p => ({ ...p, source: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Destination</label>
                <input type="text" placeholder="To city" value={form.destination}
                  onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Departure Time</label>
                <input type="time" value={form.departure_time}
                  onChange={e => setForm(p => ({ ...p, departure_time: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Arrival Time</label>
                <input type="time" value={form.arrival_time}
                  onChange={e => setForm(p => ({ ...p, arrival_time: e.target.value }))} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Total Seats</label>
                <input type="number" min="1" max="200" value={form.total_seats}
                  onChange={e => setForm(p => ({ ...p, total_seats: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" min="1" placeholder="500" value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={adding}>
              {adding ? 'Adding...' : '+ Add Vehicle'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
