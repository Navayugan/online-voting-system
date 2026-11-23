import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon, label, value, sub, color, linkTo, trend }) => (
  <Link to={linkTo || '#'} style={{ textDecoration: 'none' }}>
    <div
      style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: (color || '#1e40af') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{icon}</div>
        {trend && <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '100px', background: (color || '#1e40af') + '15', color: color || '#1e40af' }}>{trend}</span>}
      </div>
      <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>{value != null ? value : '—'}</div>
      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', fontWeight: '500' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: color || '#1e40af', marginTop: '4px', fontWeight: '600' }}>{sub}</div>}
    </div>
  </Link>
);

const DonutChart = ({ percentage, size, stroke, color, bg, label, sublabel }) => {
  const s = size || 140;
  const st = stroke || 18;
  const r = (s - st) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percentage / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={s} height={s} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={bg} strokeWidth={st} />
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={color} strokeWidth={st}
          strokeDasharray={dash + ' ' + (circ - dash)} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ marginTop: '-80px', textAlign: 'center', zIndex: 1, pointerEvents: 'none' }}>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{Math.round(percentage)}%</div>
        {sublabel && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{sublabel}</div>}
      </div>
      <div style={{ marginTop: '50px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{label}</div>
    </div>
  );
};

const BarRow = ({ label, value, max, color, total }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500', maxWidth: '70%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>{value}{total != null ? <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '11px' }}> / {total}</span> : null}</span>
      </div>
      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: '8px', transition: 'width 1s ease' }} />
      </div>
    </div>
  );
};

const Badge = ({ status }) => {
  const map = {
    ACTIVE: { bg: '#d1fae5', color: '#065f46', dot: '#059669' },
    UPCOMING: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
    CLOSED: { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
    DRAFT: { bg: '#fef9c3', color: '#713f12', dot: '#f59e0b' },
    CANCELLED: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  };
  const s = map[status] || map.DRAFT;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '100px', background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
};

const daysFromNow = dateStr => Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { org, isOrgConfigured, terms } = useOrg();
  const { auth } = useAuth();
  const primary = org?.primary_color || '#1e40af';

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', border: '4px solid #e2e8f0', borderTopColor: primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <p style={{ color: '#64748b', margin: 0 }}>Loading dashboard...</p>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: primary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Retry</button>
    </div>
  );

  const d = data;
  const totalVoters = d.employees?.active || 0;
  const totalVotes = d.totalVotes || 0;
  const votingRate = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;
  const maxDept = Math.max(...(d.departmentDistribution || []).map(x => x.employee_count), 1);
  const maxElVotes = Math.max(...(d.participationData || []).map(x => x.vote_count), 1);
  const upcomingList = (d.recentElections || []).filter(e => e.status === 'UPCOMING' || e.status === 'ACTIVE');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (auth?.user?.name || auth?.user?.username || 'Admin').split(' ')[0];
  const PALETTE = ['#1e40af', '#7c3aed', '#059669', '#d97706', '#0891b2', '#be185d', '#dc2626', '#0d9488'];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        .dash-s { animation: fadeUp 0.4s ease both; }
      `}</style>

      {!isOrgConfigured && (
        <div className="dash-s" style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #fffbeb 100%)',
          border: '1px solid #fde68a',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              🏢
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#92400e', letterSpacing: '-0.2px' }}>
                Create Your Organization Profile
              </div>
              <div style={{ fontSize: '13px', color: '#78350f', marginTop: '3px', lineHeight: '1.5' }}>
                Your organization profile is currently not set up. You must configure your organization profile before adding {(terms?.memberPlural || 'employees').toLowerCase()}, branches, or creating elections.
              </div>
            </div>
          </div>
          <Link to="/admin/organization" style={{
            background: '#d97706',
            color: '#ffffff',
            padding: '11px 20px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            Set Up Profile →
          </Link>
        </div>
      )}

      <div className="dash-s" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{greeting}, {firstName} 👋</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Here is your organization voting overview.</p>
        </div>
        {(() => {
          const next = upcomingList[0];
          if (!next) return null;
          const target = next.status === 'UPCOMING' ? new Date(next.start_date) : new Date(next.end_date);
          const diff = Math.max(target - new Date(), 0);
          const d2 = Math.floor(diff / 86400000);
          const h = Math.floor((diff % 86400000) / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const isActive = next.status === 'ACTIVE';
          return (
            <Link to="/admin/elections" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}>
                <span style={{ fontSize: '16px' }}>{isActive ? '🟢' : '📅'}</span>
                <div style={{ maxWidth: '180px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isActive ? 'Ends in' : 'Starts in'}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{next.title}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '4px' }}>
                  {[{ v: d2, u: 'd' }, { v: h, u: 'h' }, { v: m, u: 'm' }].map(({ v, u }) => (
                    <span key={u} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: isActive ? '#f0fdf4' : '#f0f4ff', borderRadius: '6px', padding: '3px 6px', minWidth: '28px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: isActive ? '#059669' : primary, lineHeight: 1 }}>{String(v).padStart(2, '0')}</span>
                      <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{u}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })()}
      </div>


      <div className="dash-s" style={{ animationDelay: '0.05s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon="👥" label={`Total ${terms?.memberPlural || 'Employees'}`} value={d.employees?.total} sub={d.employees?.active + ' Active'} color="#1e40af" linkTo="/admin/employees" trend={(d.employees?.inactive || 0) + ' Inactive'} />
        <StatCard icon="🗳️" label="Active Elections" value={d.elections?.active} sub={d.elections?.upcoming + ' Upcoming'} color="#7c3aed" linkTo="/admin/elections" />
        <StatCard icon="✅" label="Votes Cast" value={totalVotes} sub={Math.round(votingRate) + '% participation'} color="#059669" linkTo="/admin/results" />
        <StatCard icon="🗂️" label="Departments" value={d.departments} color="#d97706" linkTo="/admin/departments" />
        <StatCard icon="🏬" label="Branches" value={d.branches} color="#0891b2" linkTo="/admin/branches" />
        <StatCard icon="📋" label="Closed Elections" value={d.elections?.closed} color="#64748b" linkTo="/admin/results" />
      </div>

      <div className="dash-s" style={{ animationDelay: '0.1s', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px' }}>🗳️ Voting Snapshot</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px' }}>
            <DonutChart percentage={votingRate} color={primary} bg="#dbeafe" label="Participation Rate" sublabel={totalVotes + '/' + totalVoters} />
            <DonutChart percentage={d.elections?.total > 0 ? (d.elections.active / d.elections.total) * 100 : 0} color="#7c3aed" bg="#ede9fe" label="Elections Active" sublabel={(d.elections?.active || 0) + '/' + (d.elections?.total || 0)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '16px' }}>
            {[{ label: 'Eligible', value: totalVoters, color: '#1e40af' }, { label: 'Voted', value: totalVotes, color: '#059669' }, { label: 'Pending', value: Math.max(totalVoters - totalVotes, 0), color: '#f59e0b' }].map(item => (
              <div key={item.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>📊 Votes per Election</h3>
            <Link to="/admin/results" style={{ color: primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>View Results →</Link>
          </div>
          {(d.participationData || []).length === 0
            ? <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '30px 0' }}>No election data yet.</p>
            : (d.participationData || []).map((el, i) => (
              <BarRow key={i} label={el.title.length > 40 ? el.title.substring(0, 40) + '...' : el.title} value={el.vote_count} max={maxElVotes} color={PALETTE[i % PALETTE.length]} />
            ))}
        </div>
      </div>

      <div className="dash-s" style={{ animationDelay: '0.15s', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>👥 {terms?.memberPlural || 'Employees'} by Department</h3>
            <Link to="/admin/departments" style={{ color: primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>Manage →</Link>
          </div>
          {(d.departmentDistribution || []).length === 0
            ? <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '30px 0' }}>No department data yet.</p>
            : (d.departmentDistribution || []).map((dept, i) => (
              <BarRow key={i} label={dept.department_name} value={dept.employee_count} max={maxDept} color={PALETTE[i % PALETTE.length]} total={d.employees?.total} />
            ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>📅 Active & Upcoming</h3>
            <Link to="/admin/elections" style={{ color: primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>All →</Link>
          </div>
          {upcomingList.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No upcoming elections.</p>
                <Link to="/admin/elections/add" style={{ color: primary, fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'block', marginTop: '10px' }}>Create one →</Link>
              </div>
            )
            : upcomingList.slice(0, 4).map(el => {
              const days = el.status === 'UPCOMING' ? daysFromNow(el.start_date) : daysFromNow(el.end_date);
              const isActive = el.status === 'ACTIVE';
              return (
                <div key={el.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', marginBottom: '10px', background: isActive ? '#f0fdf4' : '#f8fafc', border: '1px solid ' + (isActive ? '#bbf7d0' : '#f1f5f9') }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: isActive ? '#059669' : primary, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{Math.max(days, 0)}</span>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>{isActive ? 'left' : 'days'}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{el.title}</div>
                    <div style={{ marginTop: '4px' }}><Badge status={el.status} /></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="dash-s" style={{ animationDelay: '0.2s', background: '#fff', borderRadius: '16px', padding: '28px 24px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>🗳️ Recent Elections</h3>
          <Link to="/admin/elections" style={{ color: primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>View All →</Link>
        </div>
        {(d.recentElections || []).length === 0
          ? <p style={{ color: '#94a3b8', fontSize: '14px' }}>No elections yet.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Election Title', 'Start Date', 'End Date', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.recentElections.map(el => (
                    <tr key={el.id} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px', fontWeight: '600', color: '#0f172a', maxWidth: '260px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{el.title}</div>
                      </td>
                      <td style={{ padding: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(el.start_date).toLocaleDateString()}</td>
                      <td style={{ padding: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(el.end_date).toLocaleDateString()}</td>
                      <td style={{ padding: '14px' }}><Badge status={el.status} /></td>
                      <td style={{ padding: '14px' }}>
                        <Link to="/admin/results" style={{ color: primary, fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>Results →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
