// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🎫 TicketEase</Link>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/search">Search Tickets</Link></li>

        {isAuthenticated ? (
          <>
            <li><Link to="/my-bookings">My Bookings</Link></li>
            {isAdmin && <li><Link to="/admin">Admin Dashboard</Link></li>}
            <li>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                Hi, {user?.name?.split(' ')[0]}
              </span>
            </li>
            <li>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li>
              <Link to="/register" style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '0.35rem 1rem',
                borderRadius: '6px',
                color: 'white'
              }}>Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
