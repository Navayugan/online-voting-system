import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';

export default function EmployeeVotePage() {
  const { id } = useParams();
  const { org } = useOrg();
  const primary = org?.primary_color || '#1e40af';

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if voted already
    api.get(`/api/employee/elections/${id}/vote-status`).then(r => {
      if (r.data.hasVoted) {
        setError('You have already voted in this election.');
        setLoading(false);
        return;
      }
      // Load election and candidates
      Promise.all([
        api.get(`/api/employee/elections/${id}`),
        api.get(`/api/employee/elections/${id}/candidates`)
      ]).then(([e, c]) => {
        setElection(e.data.election);
        setCandidates(c.data.candidates || []);
      }).catch(() => setError('Failed to load election data.'))
        .finally(() => setLoading(false));
    }).catch(() => { setError('Failed to verify voting status.'); setLoading(false); });
  }, [id]);

  const handleSubmit = async () => {
    if (!selected) return;
    if (!window.confirm('Are you sure you want to cast your vote for this candidate? This action cannot be undone.')) return;
    
    setSubmitting(true);
    try {
      await api.post(`/api/employee/elections/${id}/vote`, { candidateId: selected });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit vote.');
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading ballot...</div>;

  if (success) return (
    <div style={{ maxWidth: '600px', margin: '40px auto', background: '#fff', borderRadius: '24px', padding: '48px 32px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎉</div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px' }}>Vote Recorded Successfully!</h2>
      <p style={{ color: '#64748b', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
        Thank you for participating in {election?.title}. Your vote has been recorded and stored separately from your voter identity.
      </p>
      <Link to="/employee/elections" style={{ textDecoration: 'none' }}>
        <button style={{ padding: '14px 32px', borderRadius: '12px', background: `linear-gradient(135deg, ${primary}, #7c3aed)`, color: '#fff', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
          Return to Elections
        </button>
      </Link>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: '600px', margin: '40px auto', background: '#fff', borderRadius: '24px', padding: '48px 32px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
      <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', margin: '0 0 12px' }}>Cannot Proceed</h2>
      <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px' }}>{error}</p>
      <Link to="/employee/elections"><button style={{ padding: '12px 24px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Go Back</button></Link>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link to="/employee/elections" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', fontWeight: '500', display: 'inline-block', marginBottom: '16px' }}>← Back to Elections</Link>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Official Ballot</h1>
        <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>{election?.title}</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Select your preferred candidate:</h3>
        
        {candidates.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No candidates available for this election.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }} role="radiogroup">
            {candidates.map(c => (
              <div key={c.id} role="radio" aria-checked={selected === c.id} tabIndex={0} onClick={() => setSelected(c.id)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setSelected(c.id); }}
                style={{ padding: '20px', borderRadius: '16px', border: selected === c.id ? `2px solid ${primary}` : '1px solid #e2e8f0', background: selected === c.id ? `${primary}08` : '#fff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="candidate"
                  value={c.id}
                  checked={selected === c.id}
                  onChange={() => setSelected(c.id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: primary }}
                />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{c.employee_name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '6px' }}>{c.department_name} {c.branch_name ? `• ${c.branch_name}` : ''}</div>
                  {c.description && <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>{c.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '20px', borderRadius: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>
            {selected ? '1 candidate selected' : 'Please select a candidate to continue'}
          </div>
          <button disabled={!selected || submitting} onClick={handleSubmit}
            style={{ padding: '14px 32px', borderRadius: '12px', background: !selected ? '#cbd5e1' : `linear-gradient(135deg, ${primary}, #7c3aed)`, color: '#fff', border: 'none', fontWeight: '700', fontSize: '16px', cursor: !selected ? 'not-allowed' : 'pointer', boxShadow: selected ? '0 8px 24px rgba(0,0,0,0.15)' : 'none', transition: 'all 0.2s' }}>
            {submitting ? 'Submitting...' : 'Cast Vote'}
          </button>
        </div>
      </div>
    </div>
  );
}
