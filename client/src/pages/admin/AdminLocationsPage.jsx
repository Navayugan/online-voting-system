import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Btn, Input, Card, Badge, DataTable, Modal, Alert, SearchInput, LoadingState, ErrorState, EmptyState, ConfirmDialog, useToast, OrgRequiredModal } from '../../components/ui';

export default function AdminLocationsPage() {
  const { isOrgConfigured, terms } = useOrg();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ location_code: '', location_name: '', district: '', city: '', state: '', country: '', postal_code: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const { show, ToastContainer } = useToast();

  const load = () => {
    setLoading(true);
    api.get('/api/admin/locations').then(r => setLocations(r.data.locations || [])).catch(() => setError('Failed to load locations.')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => {
    if (!isOrgConfigured) {
      setOrgModalOpen(true);
      return;
    }
    setEditItem(null); setForm({ location_code: '', location_name: '', district: '', city: '', state: '', country: '', postal_code: '', is_active: true }); setFormError(''); setModalOpen(true);
  };
  const openEdit = (l) => { setEditItem(l); setForm({ location_code: l.location_code, location_name: l.location_name, district: l.district || '', city: l.city || '', state: l.state || '', country: l.country || '', postal_code: l.postal_code || '', is_active: !!l.is_active }); setFormError(''); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editItem && !isOrgConfigured) {
      setFormError('Please create an organization profile before adding locations.');
      return;
    }
    if (!form.location_code || !form.location_name) { setFormError('Code and name are required.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editItem) { await api.put(`/api/admin/locations/${editItem.id}`, form); show('Location updated!'); }
      else { await api.post('/api/admin/locations', form); show('Location created!'); }
      setModalOpen(false); load();
    } catch (err) { setFormError(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (loc, status) => {
    try {
      await api.put(`/api/admin/locations/${loc.id}`, { is_active: status === 'ACTIVE' });
      show(`Location ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      load();
    } catch {
      show('Failed to update status.', 'error');
    }
    setConfirmStatus(null);
  };

  const handleDelete = async (l, permanent = false) => {
    try {
      const url = permanent ? `/api/admin/locations/${l.id}?permanent=true` : `/api/admin/locations/${l.id}`;
      await api.delete(url);
      show(permanent ? 'Location deleted permanently.' : 'Location deactivated.');
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to delete location.', 'error');
    }
    setConfirmDel(null);
  };

  const filtered = locations.filter(l => !search || l.location_name.toLowerCase().includes(search.toLowerCase()) || (l.district || '').toLowerCase().includes(search.toLowerCase()) || (l.city || '').toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { key: 'location_code', label: 'Code', cellStyle: { fontFamily: 'monospace', color: '#1e40af', fontWeight: '700' } },
    { key: 'location_name', label: 'Location', render: v => <span style={{ fontWeight: '600', color: '#0f172a' }}>{v}</span> },
    { key: 'district', label: 'District', render: v => v || '—' },
    { key: 'city', label: 'City', render: v => v || '—' },
    { key: 'state', label: 'State', render: v => v || '—' },
    { key: 'country', label: 'Country', render: v => v || '—' },
    { key: 'employee_count', label: terms?.memberPlural || 'Employees', render: v => <span style={{ fontWeight: '700', color: '#059669' }}>{v}</span> },
    { key: 'is_active', label: 'Status', render: v => <Badge status={v ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <Btn size="sm" variant="ghost" title="Edit Location" onClick={e => { e.stopPropagation(); openEdit(row); }}>✏️</Btn>
        {row.is_active
          ? <Btn size="sm" variant="warning" title="Deactivate" onClick={e => { e.stopPropagation(); setConfirmStatus({ loc: row, status: 'INACTIVE' }); }}>⏸️</Btn>
          : <Btn size="sm" variant="success" title="Activate" onClick={e => { e.stopPropagation(); setConfirmStatus({ loc: row, status: 'ACTIVE' }); }}>▶️</Btn>}
        <Btn size="sm" variant="danger" title="Delete Location" onClick={e => { e.stopPropagation(); setConfirmDel({ loc: row, permanent: true }); }}>🗑️</Btn>
      </div>
    )}
  ];

  if (loading) return <LoadingState message="Loading locations..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Locations" subtitle={`${locations.length} locations configured`} action={<Btn onClick={openAdd}>➕ Add Location</Btn>} />

      {!isOrgConfigured && (
        <div style={{ marginBottom: '20px' }}>
          <Alert type="warning">
            Organization profile has not been created yet. Please <Link to="/admin/organization" style={{ color: 'inherit', fontWeight: '700', textDecoration: 'underline' }}>create your organization profile</Link> before setting up locations.
          </Alert>
        </div>
      )}

      <Card>
        <div style={{ marginBottom: '24px' }}><SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search locations..." /></div>
        {filtered.length === 0 ? <EmptyState icon="📍" title="No locations found" desc="Add your first office location" action={<Btn onClick={openAdd}>➕ Add Location</Btn>} />
          : <DataTable columns={columns} rows={filtered} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Location' : 'Add Location'}>
        <form onSubmit={handleSave}>
          {formError && <Alert type="error">{formError}</Alert>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Location Code" value={form.location_code} onChange={e => setForm({ ...form, location_code: e.target.value })} required placeholder="e.g. CHN, BLR" />
            <Input label="Location Name" value={form.location_name} onChange={e => setForm({ ...form, location_name: e.target.value })} required placeholder="e.g. Chennai Office" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="District" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="e.g. Chennai District" />
            <Input label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Chennai" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Tamil Nadu" />
            <Input label="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="India" />
          </div>
          <Input label="Postal Code" value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} placeholder="600001" />
          {editItem && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                />
                Location is Active
              </label>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: editItem ? 'space-between' : 'flex-end', marginTop: '16px' }}>
            {editItem && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn
                  type="button"
                  variant={form.is_active ? 'warning' : 'success'}
                  onClick={() => {
                    setModalOpen(false);
                    setConfirmStatus({ loc: editItem, status: form.is_active ? 'INACTIVE' : 'ACTIVE' });
                  }}
                >
                  {form.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                </Btn>
                <Btn
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setModalOpen(false);
                    setConfirmDel({ loc: editItem, permanent: true });
                  }}
                >
                  🗑️ Delete Location
                </Btn>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Create'}</Btn>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivate / Activate Single Record */}
      <ConfirmDialog
        open={!!confirmStatus}
        title={confirmStatus?.status === 'ACTIVE' ? 'Activate Location' : 'Deactivate Location'}
        message={`Are you sure you want to ${confirmStatus?.status === 'ACTIVE' ? 'activate' : 'deactivate'} "${confirmStatus?.loc?.location_name}"?`}
        variant={confirmStatus?.status === 'ACTIVE' ? 'success' : 'danger'}
        onConfirm={() => handleStatusChange(confirmStatus.loc, confirmStatus.status)}
        onCancel={() => setConfirmStatus(null)}
      />

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Location"
        message={`Are you sure you want to permanently delete "${confirmDel?.loc?.location_name}" (${confirmDel?.loc?.location_code})? Any assigned employees and branches will be unlinked safely.`}
        onConfirm={() => handleDelete(confirmDel.loc, confirmDel.permanent)}
        onCancel={() => setConfirmDel(null)}
      />

      <OrgRequiredModal open={orgModalOpen} onClose={() => setOrgModalOpen(false)} feature="locations" />
      <ToastContainer />
    </div>
  );
}
