import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Btn, Card, Badge, DataTable, LoadingState, ErrorState, EmptyState, Select, ConfirmDialog, useToast, Alert, OrgRequiredModal } from '../../components/ui';

export default function AdminElectionsPage() {
  const { isOrgConfigured } = useOrg();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const { show, ToastContainer } = useToast();

  const handleCreateClick = (e) => {
    if (!isOrgConfigured) {
      e.preventDefault();
      setOrgModalOpen(true);
    }
  };

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/api/admin/elections?${params}`).then(r => setElections(r.data.elections || [])).catch(() => setError('Failed to load elections.')).finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleStatusChange = async (el, status) => {
    try {
      await api.patch(`/api/admin/elections/${el.id}/status`, { status });
      show(`Election status changed to ${status}.`);
      load();
    } catch {
      show('Failed to change status.', 'error');
    }
    setConfirmStatus(null);
  };

  const columns = [
    { key: 'title', label: 'Election Title', render: v => <span style={{ fontWeight: '600', color: '#0f172a' }}>{v}</span> },
    { key: 'election_type', label: 'Type', render: v => v || '—' },
    { key: 'start_date', label: 'Start Date', render: v => new Date(v).toLocaleString() },
    { key: 'end_date', label: 'End Date', render: v => new Date(v).toLocaleString() },
    { key: 'candidate_count', label: 'Candidates', render: v => <span style={{ fontWeight: '700', color: '#1e40af' }}>{v}</span> },
    { key: 'total_votes', label: 'Votes', render: v => <span style={{ fontWeight: '700', color: '#059669' }}>{v}</span> },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Link to={`/admin/elections/${row.id}/edit`}><Btn size="sm" variant="ghost">✏️ Edit</Btn></Link>
        {(row.status === 'DRAFT' || row.status === 'UPCOMING') && (
          <Btn size="sm" variant="success" onClick={() => setConfirmStatus({ el: row, status: 'ACTIVE' })}>🚀 Start</Btn>
        )}
        {row.status === 'ACTIVE' && (
          <Btn size="sm" variant="warning" onClick={() => setConfirmStatus({ el: row, status: 'CLOSED' })}>🛑 Close</Btn>
        )}
      </div>
    )}
  ];

  return (
    <div>
      <PageHeader title="Elections" subtitle="Manage all organization voting events"
        action={<Link to="/admin/elections/add" onClick={handleCreateClick}><Btn>➕ Create Election</Btn></Link>} />

      {!isOrgConfigured && (
        <div style={{ marginBottom: '20px' }}>
          <Alert type="warning">
            Organization profile has not been created yet. Please <Link to="/admin/organization" style={{ color: 'inherit', fontWeight: '700', textDecoration: 'underline' }}>create your organization profile</Link> before setting up elections.
          </Alert>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1 }} />
          <Select label="" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '200px', marginBottom: 0 }}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>

        {loading ? <LoadingState message="Loading elections..." /> :
         error ? <ErrorState message={error} onRetry={load} /> :
         elections.length === 0 ? <EmptyState icon="🗳️" title="No elections found" desc="Create your first election to get started" action={<Link to="/admin/elections/add" onClick={handleCreateClick}><Btn>➕ Create Election</Btn></Link>} /> :
         <DataTable columns={columns} rows={elections} />}
      </Card>

      <ConfirmDialog open={!!confirmStatus}
        title={confirmStatus?.status === 'ACTIVE' ? 'Start Election' : 'Close Election'}
        message={`Are you sure you want to ${confirmStatus?.status.toLowerCase()} "${confirmStatus?.el?.title}"?`}
        variant={confirmStatus?.status === 'ACTIVE' ? 'success' : 'warning'}
        onConfirm={() => handleStatusChange(confirmStatus.el, confirmStatus.status)}
        onCancel={() => setConfirmStatus(null)} />
      <OrgRequiredModal open={orgModalOpen} onClose={() => setOrgModalOpen(false)} feature="elections" />
      <ToastContainer />
    </div>
  );
}
