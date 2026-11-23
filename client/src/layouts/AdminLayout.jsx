import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

const getNavGroups = (terms) => [
  {
    label: null, items: [
      { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' }
    ]
  },
  {
    label: 'Organization', items: [
      { path: '/admin/organization', icon: '🏢', label: 'Organization Profile' },
      { path: '/admin/departments', icon: '🗂️', label: 'Departments' },
      { path: '/admin/branches', icon: '🏬', label: 'Branches' },
      { path: '/admin/locations', icon: '📍', label: 'Locations' },
    ]
  },
  {
    label: terms?.memberPlural || 'Employees', items: [
      { path: '/admin/employees', icon: '👥', label: `All ${terms?.memberPlural || 'Employees'}` },
      { path: '/admin/employees/add', icon: '➕', label: `Add ${terms?.memberSingular || 'Employee'}` },
    ]
  },
  {
    label: 'Elections', items: [
      { path: '/admin/elections', icon: '🗳️', label: 'All Elections' },
      { path: '/admin/elections/add', icon: '➕', label: 'Create Election' },
      { path: '/admin/candidates', icon: '👤', label: 'Candidates' },
    ]
  },
  {
    label: 'Results', items: [
      { path: '/admin/results', icon: '📈', label: 'Election Results' },
      { path: '/admin/participation', icon: '📋', label: 'Participation' },
      { path: '/admin/audit', icon: '🔍', label: 'Audit Logs' },
    ]
  },
  {
    label: 'Settings', items: [
      { path: '/admin/profile', icon: '👤', label: 'Admin Profile' },
    ]
  }
];

const Sidebar = ({ collapsed, setCollapsed, primary, org, terms, auth, handleLogout, isActive }) => {
  const sidebarWidth = collapsed ? '68px' : '260px';
  const navContainerRef = React.useRef(null);
  const navGroups = getNavGroups(terms);

  // Preserve and restore scroll position across route navigations
  React.useEffect(() => {
    const savedScroll = sessionStorage.getItem('admin_sidebar_scroll');
    if (savedScroll && navContainerRef.current) {
      navContainerRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  const handleScroll = (e) => {
    sessionStorage.setItem('admin_sidebar_scroll', e.currentTarget.scrollTop);
  };

  return (
    <div style={{
      width: sidebarWidth, height: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease', position: 'fixed', top: 0, left: 0, zIndex: 100
    }}>
      {/* Logo & Org Header */}
      <div style={{ padding: collapsed ? '16px 14px' : '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: '72px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <Link
          to="/admin/dashboard"
          title="Dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            width: '100%',
            overflow: 'hidden',
            padding: '6px',
            borderRadius: '10px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {!collapsed ? (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '15px', letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>
                {org?.org_name || 'Setup Organization'}
              </div>
              <div style={{ color: org?.org_name ? '#94a3b8' : '#fbbf24', fontSize: '11px', fontWeight: org?.org_name ? '500' : '700' }}>
                {org?.org_name ? 'Admin Panel' : '⚠️ Profile Required'}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', textAlign: 'center', color: '#ffffff', fontWeight: '800', fontSize: '16px' }}>
              {(org?.org_name || 'A')[0].toUpperCase()}
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div
        ref={navContainerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}
      >
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: '4px' }}>
            {group.label && !collapsed && (
              <div style={{ color: '#475569', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 10px 4px' }}>{group.label}</div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '11px 16px' : '11px 12px', borderRadius: '10px', textDecoration: 'none', marginBottom: '2px', transition: 'all 0.15s',
                    background: active ? `rgba(30,64,175,0.25)` : 'transparent',
                    color: active ? '#93c5fd' : '#94a3b8',
                    borderLeft: active ? `3px solid ${primary}` : '3px solid transparent' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span style={{ fontSize: '14px', fontWeight: active ? '600' : '500', whiteSpace: 'nowrap' }}>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User + Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {!collapsed && (
          <div style={{ padding: '10px 12px', marginBottom: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
            <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600' }}>{auth?.user?.fullName || auth?.user?.username || 'Admin'}</div>
            <div style={{ color: '#475569', fontSize: '12px' }}>Administrator</div>
          </div>
        )}
        <button onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '11px 16px' : '11px 12px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const { auth, logout } = useAuth();
  const { org, isOrgConfigured, terms } = useOrg();
  const location = useLocation();
  const navigate = useNavigate();
  const primary = org?.primary_color || '#1e40af';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (org?.org_name) {
      document.title = `${org.org_name} - Admin Panel`;
    } else {
      document.title = 'Online Voting System - Admin Panel';
    }
    return () => {
      document.title = 'Online Voting System';
    };
  }, [org?.org_name]);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const isActive = (path) => location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path));
  const sidebarWidth = collapsed ? '68px' : '260px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        primary={primary}
        org={org}
        terms={terms}
        auth={auth}
        handleLogout={handleLogout}
        isActive={isActive}
      />
      <div style={{ marginLeft: sidebarWidth, flex: 1, transition: 'margin-left 0.25s ease', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          {/* Left: Breadcrumb path */}
          <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
            {location.pathname.split('/').filter(Boolean).map((s, i, arr) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {i > 0 && <span style={{ margin: '0 6px', color: '#cbd5e1' }}>›</span>}
                {i === 0 ? (
                  <span
                    onClick={() => navigate(-1)}
                    title="Go back"
                    style={{ textTransform: 'capitalize', color: '#64748b', fontWeight: '400', cursor: 'pointer', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = primary}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                  >{s}</span>
                ) : (
                  <span style={{ textTransform: 'capitalize', color: i === arr.length - 1 ? '#0f172a' : '#64748b', fontWeight: i === arr.length - 1 ? '600' : '400' }}>{s}</span>
                )}
              </span>
            ))}
          </div>

          {/* Right side: User profile & actions tooltip */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <style>{`
              .nav-user-tooltip-container {
                position: relative;
                display: inline-block;
              }

              .nav-user-text {
                color: #1e293b;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 6px 12px;
                border-radius: 8px;
                transition: background 0.15s, color 0.15s;
              }

              .nav-user-text:hover {
                background: #f1f5f9;
                color: ${primary};
              }

              .nav-user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${primary}, #7c3aed);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-weight: 700;
                font-size: 13px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.12);
              }

              .nav-user-tooltip {
                position: absolute;
                top: 100%;
                right: 0;
                opacity: 0;
                visibility: hidden;
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #fff;
                padding: 6px;
                border-radius: 10px;
                transition: opacity 0.25s ease, visibility 0.25s ease, top 0.25s ease, transform 0.25s ease;
                z-index: 100;
                box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.35), 0 8px 10px -6px rgba(15, 23, 42, 0.25);
                min-width: 175px;
                display: flex;
                flex-direction: column;
                gap: 2px;
                transform: translateY(0);
              }

              .nav-user-tooltip::before {
                content: "";
                position: absolute;
                bottom: 100%;
                right: 20px;
                border-width: 6px;
                border-style: solid;
                border-color: transparent transparent #0f172a transparent;
              }

              /* Transparent hover bridge */
              .nav-user-tooltip-container::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                height: 12px;
              }

              .nav-user-tooltip-container:hover .nav-user-tooltip {
                top: calc(100% + 8px);
                opacity: 1;
                visibility: visible;
                transform: translateY(2px);
              }

              .nav-tooltip-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 9px 12px;
                border-radius: 7px;
                color: #cbd5e1;
                text-decoration: none;
                font-size: 13px;
                font-weight: 500;
                background: transparent;
                border: none;
                cursor: pointer;
                width: 100%;
                text-align: left;
                font-family: inherit;
                transition: all 0.15s ease;
                box-sizing: border-box;
              }

              .nav-tooltip-item:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #ffffff;
              }

              .nav-tooltip-item.logout-item:hover {
                background: rgba(239, 68, 68, 0.15);
                color: #f87171;
              }
            `}</style>

            <div className="nav-user-tooltip-container">
              <div className="nav-user-text">
                <div className="nav-user-avatar">
                  {(auth?.user?.fullName || auth?.user?.username || 'A').charAt(0).toUpperCase()}
                </div>
                <span>{auth?.user?.fullName || auth?.user?.username || 'Admin'}</span>
                <svg width={10} height={10} viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.5 }}>
                  <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
                </svg>
              </div>

              <div className="nav-user-tooltip">
                <Link to="/admin/profile" className="nav-tooltip-item">
                  <svg width={15} height={15} viewBox="0 0 16 16" fill="currentColor" style={{ color: '#93c5fd' }}>
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
                  </svg>
                  <span>My Profile</span>
                </Link>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '2px 4px' }} />

                <button type="button" onClick={handleLogout} className="nav-tooltip-item logout-item">
                  <svg width={15} height={15} viewBox="0 0 16 16" fill="currentColor" style={{ color: '#f87171' }}>
                    <path fillRule="evenodd" d="M2 2.75C2 1.784 2.784 1 3.75 1h5.5a.75.75 0 0 1 0 1.5h-5.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h5.5a.75.75 0 0 1 0 1.5h-5.5A1.75 1.75 0 0 1 2 13.25V2.75Zm10.47 3.97a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H6.75a.75.75 0 0 1 0-1.5h7.44l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification bar if organization profile has not been configured */}
        {!isOrgConfigured && location.pathname !== '/admin/organization' && (
          <div style={{
            background: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            padding: '10px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#92400e'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span><strong>Organization Profile Required:</strong> Please configure your organization profile before adding {(terms?.memberPlural || 'employees').toLowerCase()} or creating elections.</span>
            </div>
            <Link to="/admin/organization" style={{ color: '#d97706', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Set Up Profile →
            </Link>
          </div>
        )}

        {/* Page content */}
        <div style={{ padding: '32px', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
