import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Card, Select, LoadingState, ErrorState, EmptyState, DataTable, Badge } from '../../components/ui';

export default function AdminParticipationPage() {
  const { terms } = useOrg();
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, VOTED, PENDING

  useEffect(() => {
    api.get('/api/admin/elections').then(r => {
      const els = r.data.elections || [];
      setElections(els);
      if (els.length > 0) setSelected(els[0].id);
      setLoading(false);
    }).catch(() => { setError('Failed to load elections.'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setData(null); setError('');
    api.get(`/api/admin/participation/${selected}`).then(r => setData(r.data)).catch(() => setError('Failed to load participation data.'));
  }, [selected]);

  const filtered = data?.participation?.filter(p => {
    if (filter === 'VOTED') return p.has_voted;
    if (filter === 'PENDING') return !p.has_voted;
    return true;
  }) || [];

  const columns = [
    { key: 'employee_id', label: terms?.memberIdShort || 'Emp ID', cellStyle: { fontFamily: 'monospace' } },
    { key: 'employee_name', label: terms?.memberNameLabel || 'Voter Name', render: v => <span style={{ fontWeight: '600' }}>{v}</span> },
    { key: 'department_name', label: 'Department', render: v => v || '—' },
    { key: 'branch_name', label: 'Branch', render: v => v || '—' },
    { key: 'has_voted', label: 'Voting Status', render: v => (
      v ? <Badge status="true" /> : <span style={{ padding: '3px 10px', borderRadius: '100px', background: '#f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: '700' }}>PENDING</span>
    ) }
  ];

  if (loading) return <LoadingState message="Loading elections..." />;

  return (
    <div>
      <PageHeader title="Voter Participation" subtitle="Track voter turnout (ballots are stored separately without voter identity)" />

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Select Election:</span>
          <Select label="" value={selected} onChange={e => setSelected(e.target.value)} style={{ flex: 1, maxWidth: '400px', marginBottom: 0 }}>
            {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </Select>
        </div>
      </Card>

      {error ? <ErrorState message={error} /> :
       !selected ? <EmptyState icon="📋" title="No election selected" desc="Select an election to view participation." /> :
       !data ? <LoadingState message="Fetching participation data..." /> :
       (
         <div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
             <Card style={{ textAlign: 'center', padding: '16px' }}>
               <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{data.total}</div>
               <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Eligible Voters</div>
             </Card>
             <Card style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
               <div style={{ fontSize: '28px', fontWeight: '800', color: '#166534' }}>{data.voted}</div>
               <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600', textTransform: 'uppercase' }}>Voted</div>
             </Card>
             <Card style={{ textAlign: 'center', padding: '16px', background: '#fffbeb', borderColor: '#fef08a' }}>
               <div style={{ fontSize: '28px', fontWeight: '800', color: '#854d0e' }}>{data.notVoted}</div>
               <div style={{ fontSize: '12px', color: '#854d0e', fontWeight: '600', textTransform: 'uppercase' }}>Pending</div>
             </Card>
           </div>

           <Card>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Voter List</h3>
               <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                 {['ALL', 'VOTED', 'PENDING'].map(f => (
                   <button key={f} onClick={() => setFilter(f)}
                     style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: filter === f ? '#fff' : 'transparent', color: filter === f ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                     {f}
                   </button>
                 ))}
               </div>
             </div>
             <DataTable columns={columns} rows={filtered} />
           </Card>
         </div>
       )
      }
    </div>
  );
}
