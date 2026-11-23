import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { API_BASE as API } from '../../api/config';

export default function LoginPage() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { org, terms } = useOrg();
  const navigate = useNavigate();

  const memberSingular = terms?.memberSingular || 'Employee';
  const memberIdLabel = terms?.memberIdLabel || 'Employee ID';
  const portalName = terms?.portalName || 'Employee Portal';
  const portalTitle = terms?.portalLoginTitle || 'Employee Voting Portal';

  useEffect(() => {
    document.title = `${org?.org_name || 'Online Voting System'} - ${portalName}`;
  }, [org?.org_name, portalName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.identifier || !form.password) {
      setError(`${memberIdLabel} and password are required.`);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/employee/login`, {
        employeeId: form.identifier.trim(),
        password: form.password
      });
      if (res.data.success) {
        login({ token: res.data.token, role: 'EMPLOYEE', user: res.data.employee });
        navigate('/employee/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || `Login failed. Please verify your ${memberIdLabel} and password.`);
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = org?.primary_color || '#0047ab';

  return (
    <div style={{ minHeight: '100vh', background: '#0a192f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '24px 16px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '76px', height: '76px', borderRadius: '22px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', padding: '8px', boxShadow: '0 20px 40px rgba(0,71,171,0.4)' }}>
            <img src="/favicon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Online Voting System
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>{portalTitle}</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '36px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#fca5a5', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {memberIdLabel}
              </label>
              <input
                id="identifier"
                type="text"
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                placeholder={terms?.memberIdPlaceholder || "e.g. EMP001"}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = primaryColor}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = primaryColor}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                required
              />
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                Note: Default password for new accounts is your {memberIdLabel}.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${primaryColor}, #3b82f6)`,
                color: '#fff',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 8px 24px rgba(0,71,171,0.4)'
              }}
            >
              {loading ? '⏳ Signing in...' : `Sign In as ${memberSingular}`}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, textAlign: 'center' }}>
            ℹ️ {terms?.portalLoginSubtitle || 'Member accounts are registered and managed by organization administrators. Contact your administrator if you need your credentials.'}
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>← Back to Home</Link>
          </div>
        </div>

        <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
          {org?.org_name ? `${org.org_name} Voting Management System` : 'Organization Voting Management System'}
        </p>
      </div>
    </div>
  );
}
