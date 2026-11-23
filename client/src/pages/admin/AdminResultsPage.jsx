import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, Card, Select, LoadingState, ErrorState, EmptyState, Badge } from '../../components/ui';

export default function AdminResultsPage() {
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    api.get(`/api/admin/results/${selected}`)
      .then(r => setData(r.data))
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to load results.';
        setError(msg);
      });
  }, [selected]);

  if (loading) return <LoadingState message="Loading elections..." />;

  return (
    <div>
      <PageHeader title="Election Results" subtitle="View real-time voting results" />

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Select Election:</span>
          <Select label="" value={selected} onChange={e => setSelected(e.target.value)} style={{ flex: 1, maxWidth: '400px', marginBottom: 0 }}>
            {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </Select>
          {data?.election && <Badge status={data.election.status} />}
        </div>
      </Card>

       {error ? <ErrorState message={error} /> :
       !selected ? <EmptyState icon="📈" title="No election selected" desc="Select an election to view its results." /> :
       !data ? <LoadingState message="Fetching results..." /> :
       (() => {
         const hasVotes = data.totalVotes > 0;
         const topCandidate = data.results && data.results.length > 0 ? data.results[0] : null;
         const isTie = hasVotes && data.results && data.results.length > 1 && data.results[0].vote_count === data.results[1].vote_count;
         const isClosed = data.election?.status === 'CLOSED';

         return (
           <div>
             {/* Highlighted & Centered Winner Section */}
             {hasVotes && topCandidate && topCandidate.vote_count > 0 && (
               <div style={{
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center',
                 margin: '0 auto 28px auto',
                 maxWidth: '720px'
               }}>
                 <Card style={{
                   width: '100%',
                   textAlign: 'center',
                   padding: '36px 28px',
                   background: isClosed
                     ? 'linear-gradient(145deg, #eff6ff 0%, #fdf4ff 50%, #fefce8 100%)'
                     : 'linear-gradient(145deg, #f0fdf4 0%, #eff6ff 100%)',
                   border: isClosed ? '2px solid #f59e0b' : '2px solid #3b82f6',
                   borderRadius: '20px',
                   boxShadow: '0 12px 30px rgba(245, 158, 11, 0.15)',
                   position: 'relative',
                   overflow: 'hidden'
                 }}>
                   <div style={{
                     display: 'inline-flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     width: '64px',
                     height: '64px',
                     borderRadius: '50%',
                     background: '#fef3c7',
                     fontSize: '32px',
                     marginBottom: '12px',
                     boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
                   }}>
                     🏆
                   </div>

                   <div style={{
                     fontSize: '13px',
                     fontWeight: '800',
                     letterSpacing: '1.5px',
                     textTransform: 'uppercase',
                     color: isClosed ? '#b45309' : '#1d4ed8',
                     marginBottom: '6px'
                   }}>
                     {isTie ? 'Leading Contenders (Tie)' : isClosed ? 'Election Winner' : 'Current Leading Candidate'}
                   </div>

                   <h2 style={{
                     fontSize: '28px',
                     fontWeight: '900',
                     color: '#0f172a',
                     margin: '0 0 6px',
                     letterSpacing: '-0.5px'
                   }}>
                     {topCandidate.employee_name}
                   </h2>

                   <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '500', marginBottom: '16px' }}>
                     {topCandidate.employee_id} • {topCandidate.department_name || 'Organization'} {topCandidate.branch_name ? `(${topCandidate.branch_name})` : ''}
                   </div>

                   <div style={{
                     display: 'inline-flex',
                     alignItems: 'center',
                     gap: '16px',
                     padding: '10px 24px',
                     background: '#ffffff',
                     borderRadius: '100px',
                     border: '1px solid #e2e8f0',
                     boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                   }}>
                     <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e40af' }}>
                       🗳️ {topCandidate.vote_count} votes
                     </span>
                     <span style={{ height: '16px', width: '1px', background: '#cbd5e1' }} />
                     <span style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                       📊 {topCandidate.percentage}% of total
                     </span>
                   </div>
                 </Card>
               </div>
             )}

             {/* Metrics Summary Grid */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
               <Card style={{ textAlign: 'center', padding: '20px' }}>
                 <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Total Votes Cast</div>
                 <div style={{ fontSize: '36px', fontWeight: '800', color: '#1e40af', lineHeight: 1 }}>{data.totalVotes}</div>
               </Card>
               <Card style={{ textAlign: 'center', padding: '20px' }}>
                 <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Eligible Voters</div>
                 <div style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{data.eligibleEmployees}</div>
               </Card>
               <Card style={{ textAlign: 'center', padding: '20px' }}>
                 <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Turnout</div>
                 <div style={{ fontSize: '36px', fontWeight: '800', color: '#059669', lineHeight: 1 }}>{data.participation}%</div>
               </Card>
             </div>

             {/* Candidate Standings */}
             <Card>
               <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px' }}>Candidate Standings</h3>
               {data.results?.length === 0 ? <p style={{ color: '#64748b' }}>No candidates found for this election.</p> :
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {data.results.map((c, i) => {
                    const isWinner = i === 0 && c.vote_count > 0;
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: isWinner ? '16px 20px' : '0px',
                          borderRadius: isWinner ? '14px' : '0px',
                          background: isWinner ? '#fefce8' : 'transparent',
                          border: isWinner ? '1.5px solid #fde047' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px' }}>
                              {i + 1}. {c.employee_name}
                            </span>
                            {isWinner && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: '#f59e0b',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: '800',
                                letterSpacing: '0.5px'
                              }}>
                                👑 WINNER
                              </span>
                            )}
                            <span style={{ color: '#64748b', fontSize: '13px' }}>{c.department_name}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '800', color: isWinner ? '#b45309' : '#1e40af', fontSize: '16px' }}>{c.vote_count} votes</div>
                            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>{c.percentage}%</div>
                          </div>
                        </div>
                        <div style={{ height: '12px', background: isWinner ? '#fef08a' : '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${c.percentage}%`,
                            background: isWinner ? 'linear-gradient(90deg, #f59e0b, #d97706)' : `linear-gradient(90deg, #1e40af, #7c3aed)`,
                            borderRadius: '6px',
                            transition: 'width 1s ease-out'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
               }
             </Card>
           </div>
         );
       })()
      }
    </div>
  );
}
