// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // POST /api/auth/login → receives { token, user }
      const res = await loginUser(form);
      login(res.data.user, res.data.token); // Save to context + localStorage
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎫</div>
        <h2>Welcome Back</h2>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="your@email.com" required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" required
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}
                  type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.2rem', color: '#718096', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: '#1a56db', fontWeight: 600 }}>Register</Link>
        </p>

        {/* Demo credentials hint */}
        <div style={{ marginTop: '1rem', background: '#ebf4ff', borderRadius: '8px', padding: '0.75rem', fontSize: '0.82rem', color: '#2b6cb0' }}>
          <strong>Demo Admin:</strong> admin@ticketapp.com / admin123<br/>
          <strong>Demo User:</strong> john@example.com / user123
        </div>
      </div>
    </div>
  );
};

export default Login;
