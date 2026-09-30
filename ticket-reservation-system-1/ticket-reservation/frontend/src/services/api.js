// src/services/api.js
// ============================================================
// Centralized Axios API service
// All HTTP requests to backend go through here.
// Automatically attaches JWT token to every request.
// ============================================================

import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// Attach JWT token from localStorage to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If token expired, redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth APIs ────────────────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser    = (data) => API.post('/auth/login', data);
export const getProfile   = ()     => API.get('/auth/profile');

// ── Vehicle APIs ─────────────────────────────────────────────
export const searchVehicles = (params) => API.get('/vehicles', { params });
export const getVehicleById = (id)     => API.get(`/vehicles/${id}`);
export const getAllVehicles  = ()       => API.get('/vehicles/all');
export const addVehicle     = (data)   => API.post('/vehicles', data);
export const updateVehicle  = (id, data) => API.put(`/vehicles/${id}`, data);
export const deleteVehicle  = (id)     => API.delete(`/vehicles/${id}`);

// ── Booking APIs ─────────────────────────────────────────────
export const createBooking    = (data) => API.post('/bookings', data);
export const getUserBookings  = (id)   => API.get(`/bookings/user/${id}`);
export const getAllBookings    = ()     => API.get('/bookings');
export const cancelBooking    = (id)   => API.put(`/bookings/${id}/cancel`);
export const getAdminStats    = ()     => API.get('/bookings/stats');
export const downloadTicket   = (id)   => API.get(`/bookings/ticket/${id}`, { responseType: 'blob' });

export default API;
