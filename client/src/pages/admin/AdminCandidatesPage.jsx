import React, { useState, useEffect } from 'react';
import { parseSpreadsheet } from '../../utils/spreadsheet';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Btn, Input, Textarea, Card, DataTable, Modal, Alert, Select, LoadingState, ErrorState, EmptyState, ConfirmDialog, useToast } from '../../components/ui';

export default function AdminCandidatesPage() {
  const { terms } = useOrg();
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedElection, setSelectedElection] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ election_id: '', employee_id: '', employee_name: '', department_id: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkElectionId, setBulkElectionId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const { show, ToastContainer } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/api/admin/candidates${selectedElection ? `?election_id=${selectedElection}` : ''}`),
      api.get('/api/admin/elections?status=DRAFT'), // Only allow adding candidates to DRAFT or UPCOMING generally, but we'll fetch all active/draft for selection
      api.get('/api/admin/departments')
    ]).then(([c, e, d]) => {
      setCandidates(c.data.candidates || []);
      setDepartments(d.data.departments || []);
      // We will actually fetch all elections so the filter works, but the add form should be restricted if we want. For now, fetch all elections for the filter:
    }).catch(console.error);

    api.get('/api/admin/elections').then(r => setElections(r.data.elections || [])).catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [selectedElection]);

  const openAdd = () => { setEditItem(null); setForm({ election_id: selectedElection, employee_id: '', employee_name: '', department_id: '', description: '' }); setFormError(''); setModalOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ election_id: c.election_id, employee_id: c.employee_id, employee_name: c.employee_name, department_id: c.department_id || '', description: c.description || '' }); setFormError(''); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.election_id || (!editItem && !form.employee_id) || !form.employee_name) { setFormError('Required fields missing.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editItem) { await api.put(`/api/admin/candidates/${editItem.id}`, form); show('Candidate updated!'); }
      else { await api.post('/api/admin/candidates', form); show('Candidate added!'); }
      setModalOpen(false); load();
    } catch (err) { setFormError(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    try { await api.delete(`/api/admin/candidates/${c.id}`); show('Candidate removed.'); load(); } catch (err) { show(err.response?.data?.message || 'Failed to remove.', 'error'); }
    setConfirmDel(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkElectionId) return show('Please select an election for import.', 'error');
    if (!bulkFile) return show('Please select an Excel or CSV file first.', 'error');
    setBulkLoading(true);
    try {
      const json = await parseSpreadsheet(bulkFile);
      if (json.length === 0) return show('File seems empty or missing data.', 'error');
      
      const candidatesList = json.map(row => {
        const item = { election_id: bulkElectionId };
        for (const key in row) { item[key.trim().toLowerCase()] = row[key]; }
        return item;
      }).filter(item => item.employee_id && item.employee_name);

      if (candidatesList.length === 0) return show('No valid records found.', 'error');

      const res = await api.post('/api/admin/candidates/bulk', { candidates: candidatesList });
      show(`Success! Imported ${res.data.addedCount} candidates.`);
      setBulkModal(false); setBulkFile(null); load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to parse or upload file.', 'error');
    } finally { setBulkLoading(false); }
  };

  const columns = [
    { key: 'election_title', label: 'Election', render: v => <span style={{ fontWeight: '600' }}>{v}</span> },
    { key: 'employee_id', label: terms?.memberIdShort || 'Emp ID', cellStyle: { fontFamily: 'monospace' } },
    { key: 'employee_name', label: 'Candidate Name', render: v => <span style={{ fontWeight: '600', color: '#0f172a' }}>{v}</span> },
    { key: 'department_name', label: 'Department', render: v => v || '—' },
    { key: 'description', label: 'Description', render: v => <span style={{ color: '#64748b', fontSize: '13px' }}>{v ? (v.length > 50 ? v.substring(0, 50) + '...' : v) : '—'}</span> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Btn size="sm" variant="ghost" onClick={() => openEdit(row)}>✏️</Btn>
        <Btn size="sm" variant="danger" onClick={() => setConfirmDel(row)}>🗑️</Btn>
      </div>
    )}
  ];

  return (
    <div>
      <PageHeader title="Candidates" subtitle="Manage candidates for elections"
        action={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Btn variant="outline" onClick={() => setBulkModal(true)}>📤 Bulk Import</Btn>
            <Btn onClick={openAdd}>➕ Add Candidate</Btn>
          </div>
        } />

      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Filter by Election:</span>
          <Select label="" value={selectedElection} onChange={e => setSelectedElection(e.target.value)} style={{ width: '300px', marginBottom: 0 }}>
            <option value="">All Elections</option>
            {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </Select>
        </div>

        {loading ? <LoadingState message="Loading candidates..." /> :
         error ? <ErrorState message={error} onRetry={load} /> :
         candidates.length === 0 ? <EmptyState icon="👤" title="No candidates found" desc="Add candidates to your elections" action={<Btn onClick={openAdd}>➕ Add Candidate</Btn>} /> :
         <DataTable columns={columns} rows={candidates} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Candidate' : 'Add Candidate'}>
        <form onSubmit={handleSave}>
          {formError && <Alert type="error">{formError}</Alert>}
          {!editItem && (
            <Select label="Select Election" value={form.election_id} onChange={e => setForm({ ...form, election_id: e.target.value })} required>
              <option value="">— Select an Election —</option>
              {elections.filter(e => e.status !== 'CLOSED' && e.status !== 'CANCELLED').map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label={terms?.memberIdLabel || "Employee ID"} value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required disabled={!!editItem} placeholder={terms?.memberIdPlaceholder || "EMP1001"} />
            <Input label="Display Name" value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })} required placeholder="Candidate Name" />
          </div>
          <Select label="Department (Optional)" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
            <option value="">— None —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id} disabled={!d.is_active && form.department_id !== d.id}>
                {d.department_name}{!d.is_active ? ' (Inactive)' : ''}
              </option>
            ))}
          </Select>
          <Textarea label="Candidate Profile/Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Write a short pitch or description..." />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add'}</Btn>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDel} title="Remove Candidate" message={`Are you sure you want to remove "${confirmDel?.employee_name}" from this election? This cannot be undone.`}
        onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)} />
      
      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Import Candidates">
        <p style={{ color: '#64748b', marginTop: 0 }}>Upload an <strong>Excel (.xlsx) or CSV file</strong> to bulk import candidates to a specific election.</p>
        
        <Select label="Select Election for Import" value={bulkElectionId} onChange={e => setBulkElectionId(e.target.value)} required>
          <option value="">— Select an Election —</option>
          {elections.filter(e => e.status !== 'CLOSED' && e.status !== 'CANCELLED').map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </Select>

        <div style={{ marginBottom: '16px', fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <strong>Required Columns:</strong><br/>
          <code style={{ color: '#be185d' }}>employee_id, employee_name</code><br/><br/>
          <strong>Optional Columns:</strong><br/>
          <code style={{ color: '#1e40af' }}>description</code>
        </div>
        <input type="file" accept=".csv, .xlsx, .xls" onChange={e => setBulkFile(e.target.files[0])} style={{ marginBottom: '24px', display: 'block', width: '100%' }} />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setBulkModal(false)}>Cancel</Btn>
          <Btn onClick={handleBulkUpload} disabled={bulkLoading}>{bulkLoading ? '⏳ Uploading...' : '📤 Import Now'}</Btn>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
}
