import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';

const daysLeft = dateStr => Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));

const Badge = ({ status }) => {
  const map = {
    ACTIVE:    { bg: '#d1fae5', color: '#065f46', dot: '#059669', label: 'ACTIVE' },
    UPCOMING:  { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'UPCOMING' },
    CLOSED:    { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: 'CLOSED' },
  };
  const s = map[status] || map.UPCOMING;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '100px', background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
};

export default function EmployeeDashboardPage() {
  const { auth } = useAuth();
  const { org } = useOrg();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const primary = org?.primary_color || '#1e40af';
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/employee/elections')
      .then(r => setElections(r.data.elections || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending = elections.filter(e => !e.has_voted && e.status === 'ACTIVE');
  const voted = elections.filter(e => e.has_voted);
  const upcomingElections = elections.filter(e => e.status === 'UPCOMING');
  const activeElections = elections.filter(e => e.status === 'ACTIVE');

  const firstName = (auth?.user?.name || 'Voter').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes pulseRing { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.08); } }
        .emp-s { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* ── Header ── */}
      <div className="emp-s" style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Here is what is happening with the elections in your organization.</p>
      </div>

      {/* ── Summary Cards Row ── */}
      <div className="emp-s" style={{ animationDelay: '0.05s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { icon: '⏳', label: 'Pending Votes', value: pending.length, color: '#f59e0b', bg: '#fef3c7', sub: 'Require your vote' },
          { icon: '🗳️', label: 'Active Elections', value: activeElections.length, color: '#059669', bg: '#d1fae5', sub: 'Currently open' },
          { icon: '📅', label: 'Upcoming', value: upcomingElections.length, color: '#1e40af', bg: '#dbeafe', sub: 'Starting soon' },
          { icon: '✅', label: 'Votes Recorded', value: voted.length, color: '#7c3aed', bg: '#ede9fe', sub: 'Your participation' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>{card.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: card.color, letterSpacing: '-1px', lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{card.label}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', fontWeight: '500' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Pending Action Banner ── */}
      {pending.length > 0 && (
        <div className="emp-s" style={{ animationDelay: '0.1s', marginBottom: '28px', background: 'linear-gradient(135deg,' + primary + ',#7c3aed)', borderRadius: '16px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 8px 24px ' + primary + '30' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', animation: 'pulseRing 2s ease infinite' }}>🗳️</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>You have {pending.length} election{pending.length > 1 ? 's' : ''} waiting for your vote!</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Your vote matters. Cast it before the deadline.</div>
            </div>
          </div>
          <button onClick={() => navigate('/employee/elections')} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Vote Now →
          </button>
        </div>
      )}

      {/* ── Elections Grid ── */}
      <div className="emp-s" style={{ animationDelay: '0.15s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Your Elections</h2>
          <Link to="/employee/elections" style={{ color: primary, fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>View All →</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading elections...</div>
        ) : elections.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '60px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>☕</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>No elections right now</h3>
            <p style={{ color: '#64748b', margin: 0 }}>There are no voting events requiring your participation at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {elections.slice(0, 6).map(e => {
              const dl = daysLeft(e.end_date);
              const isActive = e.status === 'ACTIVE';
              return (
                <div key={e.id} style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}
                  onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={ev => { ev.currentTarget.style.boxShadow = 'none'; ev.currentTarget.style.transform = 'none'; }}>

                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <Badge status={e.status} />
                    {e.has_voted
                      ? <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#d1fae5', padding: '3px 8px', borderRadius: '100px' }}>✅ Voted</span>
                      : isActive
                        ? <span style={{ fontSize: '11px', fontWeight: '700', color: dl <= 2 ? '#dc2626' : '#f59e0b', background: dl <= 2 ? '#fee2e2' : '#fef3c7', padding: '3px 8px', borderRadius: '100px' }}>
                            {dl > 0 ? dl + 'd left' : 'Ends today'}
                          </span>
                        : null}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', lineHeight: 1.3 }}>{e.title}</h3>

                  {/* Description */}
                  <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.6, margin: '0 0 16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {e.description || 'No description provided.'}
                  </p>

                  {/* Dates */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                    <span>Start: {new Date(e.start_date).toLocaleDateString()}</span>
                    <span>End: {new Date(e.end_date).toLocaleDateString()}</span>
                  </div>

                  {/* CTA */}
                  {!e.has_voted && isActive ? (
                    <Link
                      to={`/employee/elections/${e.id}/vote`}
                      style={{
                        display: 'block', width: '100%', padding: '12px', borderRadius: '10px',
                        fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none',
                        textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
                        background: 'linear-gradient(135deg,' + primary + ',#7c3aed)',
                        color: '#fff', transition: 'opacity 0.2s'
                      }}
                    >
                      Cast Your Vote →
                    </Link>
                  ) : (
                    <div
                      style={{
                        width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '700',
                        fontSize: '14px', cursor: 'not-allowed', border: 'none', textAlign: 'center',
                        boxSizing: 'border-box',
                        background: e.has_voted ? '#f1f5f9' : '#f8fafc',
                        color: '#94a3b8'
                      }}
                    >
                      {e.has_voted ? 'Vote Recorded ✅' : (e.status === 'UPCOMING' ? '📅 Not Yet Open' : '🔒 Election Closed')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upcoming Elections info strip ── */}
      {upcomingElections.length > 0 && (
        <div className="emp-s" style={{ animationDelay: '0.2s', marginTop: '28px', background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>📅 Upcoming Elections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingElections.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: primary, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{Math.max(daysLeft(e.start_date), 0)}</span>
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>days</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{e.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Opens {new Date(e.start_date).toLocaleDateString()} · Closes {new Date(e.end_date).toLocaleDateString()}</div>
                </div>
                <Badge status="UPCOMING" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Participation history strip ── */}
      {voted.length > 0 && (
        <div className="emp-s" style={{ animationDelay: '0.25s', marginTop: '20px', background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>✅ Your Voting History</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {voted.map(e => (
              <div key={e.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '14px' }}>✅</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#065f46' }}>{e.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
