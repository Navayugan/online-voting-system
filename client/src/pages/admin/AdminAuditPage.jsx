import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, Card, DataTable, LoadingState, ErrorState, Btn } from '../../components/ui';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const LIMIT = 50;

  const load = () => {
    setLoading(true);
    api.get(`/api/admin/audit-logs?page=${page}&limit=${LIMIT}`)
      .then(r => { setLogs(r.data.logs || []); setTotal(r.data.total || 0); })
      .catch(() => setError('Failed to load audit logs.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const columns = [
    { key: 'created_at', label: 'Timestamp', render: v => <span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(v).toLocaleString()}</span> },
    { key: 'username', label: 'Admin User', render: v => <span style={{ fontWeight: '600' }}>{v}</span> },
    { key: 'action', label: 'Action', render: v => (
      <span style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: '#334155' }}>{v}</span>
    ) },
    { key: 'entity_type', label: 'Entity', render: v => v || '—' },
    { key: 'description', label: 'Description', render: v => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'ip_address', label: 'IP Address', render: v => <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{v || '—'}</span> }
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Security and activity logs for the admin panel" />
      <Card>
        {loading ? <LoadingState message="Loading logs..." /> :
         error ? <ErrorState message={error} onRetry={load} /> :
         <>
           <DataTable columns={columns} rows={logs} emptyState="No audit logs found." />
           {total > LIMIT && (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
               <Btn variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Newer</Btn>
               <span style={{ fontSize: '14px', color: '#64748b' }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
               <Btn variant="ghost" size="sm" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Older →</Btn>
             </div>
           )}
         </>
        }
      </Card>
    </div>
  );
}
