import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parseSpreadsheet } from '../../utils/spreadsheet';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Btn, Input, Textarea, Card, Badge, DataTable, Modal, Alert, SearchInput, Select, LoadingState, ErrorState, EmptyState, ConfirmDialog, useToast, OrgRequiredModal } from '../../components/ui';

export default function AdminBranchesPage() {
  const { isOrgConfigured, terms } = useOrg();
  const [branches, setBranches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ branch_code: '', branch_name: '', location_id: '', address: '', description: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const { show, ToastContainer } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/api/admin/branches'), api.get('/api/admin/locations')])
      .then(([br, loc]) => { setBranches(br.data.branches || []); setLocations(loc.data.locations || []); })
      .catch(() => setError('Failed to load branches.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => {
    if (!isOrgConfigured) {
      setOrgModalOpen(true);
      return;
    }
    setEditItem(null); setForm({ branch_code: '', branch_name: '', location_id: '', address: '', description: '', is_active: true }); setFormError(''); setModalOpen(true);
  };
  const openBulk = () => {
    if (!isOrgConfigured) {
      setOrgModalOpen(true);
      return;
    }
    setBulkModal(true);
  };
  const openEdit = (b) => { setEditItem(b); setForm({ branch_code: b.branch_code, branch_name: b.branch_name, location_id: b.location_id || '', address: b.address || '', description: b.description || '', is_active: !!b.is_active }); setFormError(''); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editItem && !isOrgConfigured) {
      setFormError('Please create an organization profile before adding branches.');
      return;
    }
    if (!form.branch_code || !form.branch_name) { setFormError('Code and name are required.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editItem) { await api.put(`/api/admin/branches/${editItem.id}`, form); show('Branch updated successfully!'); }
      else { await api.post('/api/admin/branches', form); show('Branch created successfully!'); }
      setModalOpen(false); load();
    } catch (err) { setFormError(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (branch, status) => {
    try {
      await api.put(`/api/admin/branches/${branch.id}`, { is_active: status === 'ACTIVE' });
      show(`Branch ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      load();
    } catch {
      show('Failed to update status.', 'error');
    }
    setConfirmStatus(null);
  };

  const handleDelete = async (b, permanent = false) => {
    try {
      const url = permanent ? `/api/admin/branches/${b.id}?permanent=true` : `/api/admin/branches/${b.id}`;
      await api.delete(url);
      show(permanent ? 'Branch deleted permanently.' : 'Branch deactivated.');
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to delete branch.', 'error');
    }
    setConfirmDel(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return show('Please select an Excel or CSV file first.', 'error');
    setBulkLoading(true);
    try {
      const json = await parseSpreadsheet(bulkFile);
      if (json.length === 0) return show('File seems empty or missing data.', 'error');
      
      const branchesList = json.map(row => {
        const item = {};
        for (const key in row) { item[key.trim().toLowerCase()] = row[key]; }
        return item;
      }).filter(item => item.branch_code && item.branch_name);

      if (branchesList.length === 0) return show('No valid records found.', 'error');

      const res = await api.post('/api/admin/branches/bulk', { branches: branchesList });
      show(`Success! Imported ${res.data.addedCount} branches.`);
      setBulkModal(false); setBulkFile(null); load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to parse or upload file.', 'error');
    } finally { setBulkLoading(false); }
  };

  const filtered = branches.filter(b =>
    !search ||
    b.branch_name.toLowerCase().includes(search.toLowerCase()) ||
    b.branch_code.toLowerCase().includes(search.toLowerCase()) ||
    (b.address || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.location_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'branch_code', label: 'Code', cellStyle: { fontFamily: 'monospace', color: '#1e40af', fontWeight: '700' } },
    { key: 'branch_name', label: 'Branch Name', render: v => <span style={{ fontWeight: '600', color: '#0f172a' }}>{v}</span> },
    { key: 'location_name', label: 'Location', render: v => v || '—' },
    { key: 'address', label: 'Office Address', render: v => <span style={{ color: '#475569', fontSize: '13px' }}>{v || '—'}</span> },
    { key: 'description', label: 'Description', render: v => <span style={{ color: '#64748b', fontSize: '13px' }}>{v || '—'}</span> },
    { key: 'employee_count', label: terms?.memberPlural || 'Employees', render: v => <span style={{ fontWeight: '700', color: '#059669' }}>{v}</span> },
    { key: 'is_active', label: 'Status', render: v => <Badge status={v ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <Btn size="sm" variant="ghost" title="Edit Branch" onClick={e => { e.stopPropagation(); openEdit(row); }}>✏️</Btn>
        {row.is_active
          ? <Btn size="sm" variant="warning" title="Deactivate" onClick={e => { e.stopPropagation(); setConfirmStatus({ branch: row, status: 'INACTIVE' }); }}>⏸️</Btn>
          : <Btn size="sm" variant="success" title="Activate" onClick={e => { e.stopPropagation(); setConfirmStatus({ branch: row, status: 'ACTIVE' }); }}>▶️</Btn>}
        <Btn size="sm" variant="danger" title="Delete Branch" onClick={e => { e.stopPropagation(); setConfirmDel({ branch: row, permanent: true }); }}>🗑️</Btn>
      </div>
    )}
  ];

  if (loading) return <LoadingState message="Loading branches..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Branches" subtitle={`${branches.length} branches configured`} action={
        <div style={{ display: 'flex', gap: '12px' }}>
          <Btn variant="outline" onClick={openBulk}>📤 Bulk Import</Btn>
          <Btn onClick={openAdd}>➕ Add Branch</Btn>
        </div>
      } />

      {!isOrgConfigured && (
        <div style={{ marginBottom: '20px' }}>
          <Alert type="warning">
            Organization profile has not been created yet. Please <Link to="/admin/organization" style={{ color: 'inherit', fontWeight: '700', textDecoration: 'underline' }}>create your organization profile</Link> before setting up company branches.
          </Alert>
        </div>
      )}

      <Card>
        <div style={{ marginBottom: '24px' }}><SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search branches..." /></div>
        {filtered.length === 0 ? <EmptyState icon="🏬" title="No branches found" desc="Add your first branch" action={<Btn onClick={openAdd}>➕ Add Branch</Btn>} />
          : <DataTable columns={columns} rows={filtered} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Branch' : 'Add Branch'}>
        <form onSubmit={handleSave}>
          {formError && <Alert type="error">{formError}</Alert>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Branch Code" value={form.branch_code} onChange={e => setForm({ ...form, branch_code: e.target.value })} required placeholder="e.g. CHN-001" />
            <Input label="Branch Name" value={form.branch_name} onChange={e => setForm({ ...form, branch_name: e.target.value })} required placeholder="e.g. Chennai Branch" />
          </div>
          <Select label="Location" value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })}>
            <option value="">— No Location —</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
          </Select>
          <Textarea label="Office Address (Current Physical Location)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address of the office's current physical location (e.g. Floor 4, Cyber City, Old Mahabalipuram Rd)..." rows={2} />
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional branch notes or description..." />
          {editItem && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                />
                Branch is Active
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
                    setConfirmStatus({ branch: editItem, status: form.is_active ? 'INACTIVE' : 'ACTIVE' });
                  }}
                >
                  {form.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                </Btn>
                <Btn
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setModalOpen(false);
                    setConfirmDel({ branch: editItem, permanent: true });
                  }}
                >
                  🗑️ Delete Branch
                </Btn>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update Branch' : 'Create Branch'}</Btn>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivate / Activate Single Record */}
      <ConfirmDialog
        open={!!confirmStatus}
        title={confirmStatus?.status === 'ACTIVE' ? 'Activate Branch' : 'Deactivate Branch'}
        message={`Are you sure you want to ${confirmStatus?.status === 'ACTIVE' ? 'activate' : 'deactivate'} "${confirmStatus?.branch?.branch_name}"?`}
        variant={confirmStatus?.status === 'ACTIVE' ? 'success' : 'danger'}
        onConfirm={() => handleStatusChange(confirmStatus.branch, confirmStatus.status)}
        onCancel={() => setConfirmStatus(null)}
      />

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Branch"
        message={`Are you sure you want to permanently delete "${confirmDel?.branch?.branch_name}" (${confirmDel?.branch?.branch_code})? Any assigned employees will be unlinked safely.`}
        onConfirm={() => handleDelete(confirmDel.branch, confirmDel.permanent)}
        onCancel={() => setConfirmDel(null)}
      />

      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Import Branches">
        <p style={{ color: '#64748b', marginTop: 0 }}>Upload an <strong>Excel (.xlsx) or CSV file</strong> to bulk import branches.</p>
        <div style={{ marginBottom: '16px', fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <strong>Required Columns:</strong><br/>
          <code style={{ color: '#be185d' }}>branch_code, branch_name</code><br/><br/>
          <strong>Optional Columns:</strong><br/>
          <code style={{ color: '#1e40af' }}>address, description</code>
        </div>
        <input type="file" accept=".csv, .xlsx, .xls" onChange={e => setBulkFile(e.target.files[0])} style={{ marginBottom: '24px', display: 'block', width: '100%' }} />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setBulkModal(false)}>Cancel</Btn>
          <Btn onClick={handleBulkUpload} disabled={bulkLoading}>{bulkLoading ? '⏳ Uploading...' : '📤 Import Now'}</Btn>
        </div>
      </Modal>

      <OrgRequiredModal open={orgModalOpen} onClose={() => setOrgModalOpen(false)} feature="company branches" />
      <ToastContainer />
    </div>
  );
}
