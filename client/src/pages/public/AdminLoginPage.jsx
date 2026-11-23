import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE as API } from '../../api/config';

export default function AdminLoginPage({ initialMode = 'signin' }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paramMode = searchParams.get('mode');

  const [mode, setMode] = useState(paramMode || (location.pathname === '/admin-signup' ? 'signup' : initialMode));
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    full_name: '',
    username: '',
    email: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Online Voting System - Admin Portal';
    
    // Check if system has any registered administrators
    axios.get(`${API}/api/auth/admin/status`)
      .then(res => {
        if (res.data?.success && res.data.hasAdmin === false) {
          setHasAdmin(false);
          setMode('signup');
        } else if (res.data?.success && res.data.hasAdmin === true) {
          setHasAdmin(true);
          if (paramMode) {
            setMode(paramMode);
          } else if (location.pathname === '/admin-signup') {
            setMode('signup');
          }
        }
      })
      .catch(() => {
        if (paramMode) {
          setMode(paramMode);
        } else if (location.pathname === '/admin-signup') {
          setMode('signup');
        }
      });
  }, [location.pathname, paramMode]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.identifier || !form.password) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/admin/login`, {
        username: form.identifier.trim(),
        password: form.password
      });
      if (res.data.success) {
        login({ token: res.data.token, role: 'ADMIN', user: res.data.admin });
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.full_name || !form.username || !form.email || !form.new_password) {
      setError('Full Name, Username, Email, and Password are required.');
      return;
    }

    if (form.new_password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/admin/register`, {
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.new_password
      });

      if (res.data.success) {
        setSuccess('Admin account created successfully! Logging you in...');
        setTimeout(() => {
          login({ token: res.data.token, role: 'ADMIN', user: res.data.admin });
          navigate('/admin/dashboard');
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Admin registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a192f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '24px 16px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: `linear-gradient(135deg, #ff3333, #b91c1c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px', boxShadow: '0 20px 40px rgba(185,28,28,0.4)' }}>
            🛡️
          </div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Online Voting System
          </h1>
          <p style={{ color: '#ff3333', fontSize: '15px', margin: 0, fontWeight: '600' }}>
            {mode === 'signin' ? 'Secure Admin Portal' : 'Create New Administrator Account'}
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '32px 36px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>
          
          {/* Navigation link back to home */}
          <div style={{ marginBottom: '20px' }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '500', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
              ← Back to Home
            </Link>
          </div>

          {/* Setup notice when no admin account exists */}
          {!hasAdmin && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '14px',
              padding: '16px',
              color: '#93c5fd',
              fontSize: '13px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              lineHeight: 1.5
            }}>
              <span style={{ fontSize: '22px', lineHeight: 1 }}>🚀</span>
              <div>
                <strong style={{ color: '#bfdbfe', fontSize: '14px', display: 'block', marginBottom: '2px' }}>
                  Initial Setup: Create Super Administrator
                </strong>
                No administrator accounts exist in the system yet. Fill out the form below to create your primary Super Administrator credentials.
              </div>
            </div>
          )}

          {/* Segmented Switcher: Sign In vs Sign Up */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '26px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              type="button"
              id="admin-tab-signin"
              disabled={!hasAdmin}
              onClick={() => {
                if (!hasAdmin) return;
                setMode('signin');
                setError('');
                setSuccess('');
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: mode === 'signin' ? `linear-gradient(135deg, #ff3333, #b91c1c)` : 'transparent',
                color: !hasAdmin ? '#64748b' : mode === 'signin' ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                fontSize: '14px',
                cursor: !hasAdmin ? 'not-allowed' : 'pointer',
                opacity: !hasAdmin ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: mode === 'signin' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
              }}
              title={!hasAdmin ? 'Please create an administrator account first' : ''}
            >
              Sign In
            </button>
            <button
              type="button"
              id="admin-tab-signup"
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: mode === 'signup' ? `linear-gradient(135deg, #ff3333, #b91c1c)` : 'transparent',
                color: mode === 'signup' ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mode === 'signup' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              {!hasAdmin ? '✨ Setup Super Admin' : 'Sign Up'}
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#fca5a5', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#6ee7b7', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✅ {success}
            </div>
          )}

          {/* SIGN IN */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: '18px' }}>
                <label htmlFor="identifier" style={labelStyle}>Admin Username</label>
                <input
                  id="identifier"
                  name="identifier"
                  autoComplete="username"
                  type="text"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="Enter admin username"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#ff3333'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <input
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#ff3333'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: `linear-gradient(135deg, #ff3333, #b91c1c)`,
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 24px rgba(185,28,28,0.4)'
                }}
              >
                {loading ? '⏳ Authenticating...' : 'Sign In as Admin'}
              </button>
            </form>
          ) : (
            /* SIGN UP */
            <form onSubmit={handleSignUp}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Administrator"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#ff3333'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Username *</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="e.g. admin_alex"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#ff3333'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@company.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#ff3333'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Password (Min 10 characters) *</label>
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={form.new_password}
                  onChange={handleChange}
                  placeholder="At least 10 characters"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#ff3333'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Confirm Password *</label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#ff3333'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: `linear-gradient(135deg, #ff3333, #b91c1c)`,
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 24px rgba(185,28,28,0.4)'
                }}
              >
                {loading ? '⏳ Creating admin account...' : 'Create Admin Account'}
              </button>
            </form>
          )}

          {/* Bottom Switcher */}
          <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
            {mode === 'signin' ? (
              <span>
                Don't have an admin account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', color: '#f87171', fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already have an admin account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', color: '#f87171', fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Sign in here
                </button>
              </span>
            )}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
