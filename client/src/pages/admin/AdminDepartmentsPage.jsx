import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parseSpreadsheet } from '../../utils/spreadsheet';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Btn, Input, Textarea, Card, Badge, DataTable, Modal, Alert, SearchInput, LoadingState, ErrorState, EmptyState, ConfirmDialog, useToast, OrgRequiredModal } from '../../components/ui';

export default function AdminDepartmentsPage() {
  const { isOrgConfigured, terms } = useOrg();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ department_code: '', department_name: '', description: '' });
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
    api.get('/api/admin/departments').then(r => setDepartments(r.data.departments || [])).catch(() => setError('Failed to load departments.')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => {
    if (!isOrgConfigured) {
      setOrgModalOpen(true);
      return;
    }
    setEditItem(null); setForm({ department_code: '', department_name: '', description: '', is_active: true }); setFormError(''); setModalOpen(true);
  };
  const openBulk = () => {
    if (!isOrgConfigured) {
      setOrgModalOpen(true);
      return;
    }
    setBulkModal(true);
  };
  const openEdit = (d) => { setEditItem(d); setForm({ department_code: d.department_code, department_name: d.department_name, description: d.description || '', is_active: !!d.is_active }); setFormError(''); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editItem && !isOrgConfigured) {
      setFormError('Please create an organization profile before adding departments.');
      return;
    }
    if (!form.department_code || !form.department_name) { setFormError('Code and name are required.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editItem) { await api.put(`/api/admin/departments/${editItem.id}`, form); show('Department updated successfully!'); }
      else { await api.post('/api/admin/departments', form); show('Department created successfully!'); }
      setModalOpen(false); load();
    } catch (err) { setFormError(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (dept, status) => {
    try {
      await api.put(`/api/admin/departments/${dept.id}`, { is_active: status === 'ACTIVE' });
      show(`Department ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      load();
    } catch {
      show('Failed to update status.', 'error');
    }
    setConfirmStatus(null);
  };

  const handleDelete = async (d, permanent = false) => {
    try {
      const url = permanent ? `/api/admin/departments/${d.id}?permanent=true` : `/api/admin/departments/${d.id}`;
      await api.delete(url);
      show(permanent ? 'Department deleted permanently.' : 'Department deactivated.');
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to delete department.', 'error');
    }
    setConfirmDel(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return show('Please select an Excel or CSV file first.', 'error');
    setBulkLoading(true);
    try {
      const json = await parseSpreadsheet(bulkFile);
      if (json.length === 0) return show('File seems empty or missing data.', 'error');
      
      const departments = json.map(row => {
        const item = {};
        for (const key in row) { item[key.trim().toLowerCase()] = row[key]; }
        return item;
      }).filter(item => item.department_code && item.department_name);

      if (departments.length === 0) return show('No valid records found.', 'error');

      const res = await api.post('/api/admin/departments/bulk', { departments });
      show(`Success! Imported ${res.data.addedCount} departments.`);
      setBulkModal(false); setBulkFile(null); load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to parse or upload file.', 'error');
    } finally { setBulkLoading(false); }
  };

  const filtered = departments.filter(d => !search || d.department_name.toLowerCase().includes(search.toLowerCase()) || d.department_code.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { key: 'department_code', label: 'Code', nowrap: true, cellStyle: { fontFamily: 'monospace', color: '#1e40af', fontWeight: '700' } },
    { key: 'department_name', label: 'Department Name', render: v => <span style={{ fontWeight: '600', color: '#0f172a' }}>{v}</span> },
    { key: 'description', label: 'Description', render: v => <span style={{ color: '#64748b', fontSize: '13px' }}>{v || '—'}</span> },
    { key: 'employee_count', label: terms?.memberPlural || 'Employees', render: v => <span style={{ fontWeight: '700', color: '#059669' }}>{v}</span> },
    { key: 'is_active', label: 'Status', render: v => <Badge status={v ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <Btn size="sm" variant="ghost" title="Edit Department" onClick={e => { e.stopPropagation(); openEdit(row); }}>✏️</Btn>
        {row.is_active
          ? <Btn size="sm" variant="warning" title="Deactivate" onClick={e => { e.stopPropagation(); setConfirmStatus({ dept: row, status: 'INACTIVE' }); }}>⏸️</Btn>
          : <Btn size="sm" variant="success" title="Activate" onClick={e => { e.stopPropagation(); setConfirmStatus({ dept: row, status: 'ACTIVE' }); }}>▶️</Btn>}
        <Btn size="sm" variant="danger" title="Delete Department" onClick={e => { e.stopPropagation(); setConfirmDel({ dept: row, permanent: true }); }}>🗑️</Btn>
      </div>
    )}
  ];

  if (loading) return <LoadingState message="Loading departments..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Departments" subtitle={`${departments.length} departments configured`}
        action={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Btn variant="outline" onClick={openBulk}>📤 Bulk Import</Btn>
            <Btn onClick={openAdd}>➕ Add Department</Btn>
          </div>
        } />

      {!isOrgConfigured && (
        <div style={{ marginBottom: '20px' }}>
          <Alert type="warning">
            Organization profile has not been created yet. Please <Link to="/admin/organization" style={{ color: 'inherit', fontWeight: '700', textDecoration: 'underline' }}>create your organization profile</Link> before setting up departments.
          </Alert>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}><SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments..." /></div>
        </div>
        {filtered.length === 0 ? <EmptyState icon="🗂️" title="No departments found" desc="Create your first department to get started" action={<Btn onClick={openAdd}>➕ Add Department</Btn>} />
          : <DataTable columns={columns} rows={filtered} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSave}>
          {formError && <Alert type="error">{formError}</Alert>}
          <Input label="Department Code" value={form.department_code} onChange={e => setForm({ ...form, department_code: e.target.value })} required placeholder="e.g. IT, HR, FIN" />
          <Input label="Department Name" value={form.department_name} onChange={e => setForm({ ...form, department_name: e.target.value })} required placeholder="e.g. Information Technology" />
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this department..." />
          {editItem && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                />
                Department is Active
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
                    setConfirmStatus({ dept: editItem, status: form.is_active ? 'INACTIVE' : 'ACTIVE' });
                  }}
                >
                  {form.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                </Btn>
                <Btn
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setModalOpen(false);
                    setConfirmDel({ dept: editItem, permanent: true });
                  }}
                >
                  🗑️ Delete Department
                </Btn>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update Department' : 'Create Department'}</Btn>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivate / Activate Single Record */}
      <ConfirmDialog
        open={!!confirmStatus}
        title={confirmStatus?.status === 'ACTIVE' ? 'Activate Department' : 'Deactivate Department'}
        message={`Are you sure you want to ${confirmStatus?.status === 'ACTIVE' ? 'activate' : 'deactivate'} "${confirmStatus?.dept?.department_name}"?`}
        variant={confirmStatus?.status === 'ACTIVE' ? 'success' : 'danger'}
        onConfirm={() => handleStatusChange(confirmStatus.dept, confirmStatus.status)}
        onCancel={() => setConfirmStatus(null)}
      />

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Department"
        message={`Are you sure you want to permanently delete "${confirmDel?.dept?.department_name}" (${confirmDel?.dept?.department_code})? Any assigned employees will be unlinked safely.`}
        onConfirm={() => handleDelete(confirmDel.dept, confirmDel.permanent)}
        onCancel={() => setConfirmDel(null)}
      />
      
      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Import Departments">
        <p style={{ color: '#64748b', marginTop: 0 }}>Upload an <strong>Excel (.xlsx) or CSV file</strong> to bulk import departments.</p>
        <div style={{ marginBottom: '16px', fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <strong>Required Columns:</strong><br/>
          <code style={{ color: '#be185d' }}>department_code, department_name</code><br/><br/>
          <strong>Optional Columns:</strong><br/>
          <code style={{ color: '#1e40af' }}>description</code>
        </div>
        <input type="file" accept=".csv, .xlsx, .xls" onChange={e => setBulkFile(e.target.files[0])} style={{ marginBottom: '24px', display: 'block', width: '100%' }} />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setBulkModal(false)}>Cancel</Btn>
          <Btn onClick={handleBulkUpload} disabled={bulkLoading}>{bulkLoading ? '⏳ Uploading...' : '📤 Import Now'}</Btn>
        </div>
      </Modal>

      <OrgRequiredModal open={orgModalOpen} onClose={() => setOrgModalOpen(false)} feature="departments" />
      <ToastContainer />
    </div>
  );
}
