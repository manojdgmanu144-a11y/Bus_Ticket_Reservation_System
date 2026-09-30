// src/pages/Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState({
    source: '', destination: '', date: '', vehicle_type: ''
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(search).toString();
    navigate(`/search?${params}`);
  };

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────── */}
      <div className="hero">
        <h1>🚌 Book Bus & Train Tickets</h1>
        <p>Fast, easy, and secure ticket booking for your journeys across India</p>
      </div>

      {/* ── Search Form ────────────────────────────────── */}
      <div style={{ padding: '0 1.5rem' }}>
        <div className="search-card">
          <h3 style={{ marginBottom: '1.2rem', color: '#1a202c' }}>Search Tickets</h3>
          <form onSubmit={handleSearch}>
            <div className="form-row">
              <div className="form-group">
                <label>From</label>
                <input type="text" placeholder="e.g., Mumbai"
                  value={search.source}
                  onChange={e => setSearch(p => ({ ...p, source: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>To</label>
                <input type="text" placeholder="e.g., Delhi"
                  value={search.destination}
                  onChange={e => setSearch(p => ({ ...p, destination: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date"
                  value={search.date}
                  onChange={e => setSearch(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={search.vehicle_type}
                  onChange={e => setSearch(p => ({ ...p, vehicle_type: e.target.value }))}>
                  <option value="">All</option>
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ marginTop: '0.5rem' }}>
              🔍 Search Tickets
            </button>
          </form>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────── */}
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginTop: '1rem' }}>
          {[
            { icon: '🔒', title: 'Secure Booking', desc: 'JWT-protected transactions with encrypted passwords' },
            { icon: '💺', title: 'Seat Selection', desc: 'Visual seat map with real-time availability updates' },
            { icon: '📄', title: 'PDF Tickets', desc: 'Download your ticket instantly after booking' },
            { icon: '📱', title: 'Mobile Friendly', desc: 'Responsive design works on all screen sizes' },
          ].map(f => (
            <div className="card" key={f.title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h4 style={{ marginBottom: '0.5rem' }}>{f.title}</h4>
              <p style={{ color: '#718096', fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
