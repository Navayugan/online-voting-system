import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';

export default function EmployeeElectionsPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { org } = useOrg();
  const primary = org?.primary_color || '#1e40af';

  useEffect(() => {
    api.get('/api/employee/elections')
      .then(r => setElections(r.data.elections || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading elections...</div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>All Elections</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Elections you are eligible to participate in.</p>
      </div>

      {elections.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '80px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>No active elections</h3>
          <p style={{ color: '#64748b', margin: 0 }}>There are currently no elections available for you.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {elections.map(e => (
            <div key={e.id} style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '100px', background: e.has_voted ? '#d1fae5' : '#fef9c3', color: e.has_voted ? '#065f46' : '#854d0e', fontSize: '12px', fontWeight: '700' }}>
                    {e.has_voted ? 'VOTED ✅' : 'PENDING ⏳'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>{e.election_type}</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>{e.title}</h3>
                <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, margin: '0 0 16px' }}>{e.description}</p>
                <div style={{ display: 'flex', gap: '24px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                  <div>📅 Closes: <strong style={{ color: '#0f172a' }}>{new Date(e.end_date).toLocaleDateString()}</strong></div>
                  <div>👥 Candidates: <strong style={{ color: '#0f172a' }}>{e.candidate_count}</strong></div>
                </div>
              </div>

              <div>
                {e.has_voted ? (
                  <button disabled style={{ padding: '14px 32px', borderRadius: '12px', background: '#f1f5f9', color: '#94a3b8', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'not-allowed' }}>
                    Vote Recorded
                  </button>
                ) : (
                  <Link to={`/employee/elections/${e.id}/vote`} style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '14px 32px', borderRadius: '12px', background: `linear-gradient(135deg, ${primary}, #7c3aed)`, color: '#fff', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                      Vote Now →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
