import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

export default function EmployeeLayout() {
  const { auth, logout } = useAuth();
  const { org, terms } = useOrg();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const primary = org?.primary_color || '#1e40af';
  const portalName = terms?.portalName || 'Employee Portal';

  const navs = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/employee/elections', label: 'Elections', icon: '🗳️' },
    { path: '/employee/profile', label: 'My Profile', icon: '👤' }
  ];

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = p => location.pathname.startsWith(p);

  useEffect(() => {
    if (org?.org_name) {
      document.title = `${org.org_name} - ${portalName}`;
    } else {
      document.title = `Online Voting System - ${portalName}`;
    }
    return () => {
      document.title = 'Online Voting System';
    };
  }, [org?.org_name, portalName]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* Navbar */}
      <nav style={{ background: `linear-gradient(135deg, ${primary}, #7c3aed)`, color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>{org?.org_name || 'OVMS'}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>{portalName}</div>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {navs.map(n => (
            <Link key={n.path} to={n.path} style={{ padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', color: '#fff', fontWeight: isActive(n.path) ? '700' : '500', background: isActive(n.path) ? 'rgba(255,255,255,0.18)' : 'transparent', transition: 'background 0.2s', fontSize: '14px' }}>
              <span style={{ marginRight: '6px' }}>{n.icon}</span> {n.label}
            </Link>
          ))}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />
          
          {/* User trigger button */}
          <div
            ref={triggerRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '10px',
              background: menuOpen ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)',
              transition: 'background 0.15s ease',
              userSelect: 'none'
            }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#fff', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
              {(auth?.user?.name || 'E')[0]}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{auth?.user?.name?.split(' ')[0]}</div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.2s ease',
                transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                opacity: 0.8
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </nav>

      {/* User Dropdown */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            background: '#ffffff',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            zIndex: 200,
            minWidth: '240px',
            animation: 'fadeInDown 0.15s ease-out'
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{auth?.user?.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {auth?.user?.employeeId} {auth?.user?.departmentName ? `• ${auth?.user?.departmentName}` : ''}
            </div>
          </div>
          <Link
            to="/employee/profile"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              color: '#334155',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>👤</span>
            <span>My Profile</span>
          </Link>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              padding: '10px 12px',
              color: '#ef4444',
              background: 'rgba(239,68,68,0.06)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '4px',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <Outlet />
      </div>
    </div>
  );
}
