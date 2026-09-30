// src/pages/Search.js
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchVehicles } from '../services/api';
import toast from 'react-hot-toast';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [filters, setFilters]   = useState({
    source:       searchParams.get('source') || '',
    destination:  searchParams.get('destination') || '',
    date:         searchParams.get('date') || '',
    vehicle_type: searchParams.get('vehicle_type') || '',
  });

  // Auto-search if URL has params
  useEffect(() => {
    if (filters.source || filters.destination || filters.date) {
      doSearch();
    }
    // eslint-disable-next-line
  }, []);

  const doSearch = async () => {
    setLoading(true);
    try {
      // GET /api/vehicles?source=...&destination=...&date=...
      const res = await searchVehicles(filters);
      setVehicles(res.data.vehicles);
      if (res.data.vehicles.length === 0) {
        toast('No vehicles found for this route/date.', { icon: '🔍' });
      }
    } catch (err) {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(filters);
    doSearch();
  };

  return (
    <div className="page-container">
      <h2 className="page-title">Search Tickets</h2>

      {/* Search Filters */}
      <div className="card">
        <form onSubmit={handleSearch}>
          <div className="form-row">
            <div className="form-group">
              <label>From</label>
              <input type="text" placeholder="Source city"
                value={filters.source}
                onChange={e => setFilters(p => ({ ...p, source: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>To</label>
              <input type="text" placeholder="Destination city"
                value={filters.destination}
                onChange={e => setFilters(p => ({ ...p, destination: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date"
                value={filters.date}
                onChange={e => setFilters(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={filters.vehicle_type}
                onChange={e => setFilters(p => ({ ...p, vehicle_type: e.target.value }))}>
                <option value="">All</option>
                <option value="bus">Bus</option>
                <option value="train">Train</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading && <div className="loading">Searching for vehicles</div>}

      {!loading && vehicles.length > 0 && (
        <p style={{ marginBottom: '1rem', color: '#718096' }}>
          Found <strong>{vehicles.length}</strong> vehicle(s)
        </p>
      )}

      {vehicles.map(v => (
        <div className="vehicle-card" key={v.id}>
          <div className="vehicle-card-header">
            <div>
              <span className={`badge badge-${v.vehicle_type}`}>
                {v.vehicle_type === 'bus' ? '🚌' : '🚂'} {v.vehicle_type}
              </span>
              <div className="vehicle-name" style={{ marginTop: '0.4rem' }}>{v.vehicle_name}</div>
            </div>
            <div className="vehicle-price">₹{parseFloat(v.price).toFixed(0)}</div>
          </div>

          <div className="vehicle-route">
            <div>
              <div className="route-city">{v.source}</div>
              <div className="route-time">{formatTime(v.departure_time)}</div>
            </div>
            <div className="route-arrow">──────→</div>
            <div>
              <div className="route-city">{v.destination}</div>
              <div className="route-time">{formatTime(v.arrival_time)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-seats">
                💺 {v.available_seats}/{v.total_seats} seats available
              </span>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.82rem', color: '#718096' }}>
                {new Date(v.date).toDateString()}
              </span>
            </div>
            {v.available_seats > 0 ? (
              <Link to={`/book/${v.id}`} className="btn btn-primary btn-sm">
                Book Now →
              </Link>
            ) : (
              <span style={{ color: '#e53e3e', fontWeight: 600, fontSize: '0.9rem' }}>Sold Out</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper: "13:00:00" → "1:00 PM"
const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

export default Search;
