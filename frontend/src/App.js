// src/App.js
// ============================================================
// Main App - React Router setup
// ============================================================
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar       from './components/Navbar';
import Home         from './pages/Home';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Search       from './pages/Search';
import BookTicket   from './pages/BookTicket';
import MyBookings   from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/search"      element={<Search />} />
          <Route path="/book/:id"    element={<BookTicket />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/admin"       element={<AdminDashboard />} />
        </Routes>

        {/* Toast notifications (top-right corner) */}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
