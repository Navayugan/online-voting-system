import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { parseSpreadsheet } from '../../utils/spreadsheet';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Btn, Card, Badge, DataTable, SearchInput, Select, LoadingState, ErrorState, EmptyState, ConfirmDialog, Modal, Input, useToast, Alert, OrgRequiredModal } from '../../components/ui';

export default function AdminEmployeesPage() {
  const { isOrgConfigured, terms } = useOrg();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Choice & Selection mode states
  const [deleteOptionsModalOpen, setDeleteOptionsModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false);
  const [confirmRemoveSelected, setConfirmRemoveSelected] = useState(false);

  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [orgModalOpen, setOrgModalOpen] = useState(false);

  // Recycle Bin states
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);
  const [recycleBinList, setRecycleBinList] = useState([]);
  const [recycleBinLoading, setRecycleBinLoading] = useState(false);
  const [recycleBinCount, setRecycleBinCount] = useState(0);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState(null);
  const [confirmEmptyBin, setConfirmEmptyBin] = useState(false);
  const [confirmRestoreAll, setConfirmRestoreAll] = useState(false);

  const { show, ToastContainer } = useToast();

  const handleAddClick = (e) => {
    if (!isOrgConfigured) {
      e.preventDefault();
      setOrgModalOpen(true);
    }
  };

  const handleBulkClick = () => {
    if (!isOrgConfigured) {
      setOrgModalOpen(true);
      return;
    }
    setBulkModal(true);
  };

  const LIMIT = 20;

  const fetchRecycleBinCount = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/employees/recycle-bin');
      setRecycleBinCount(res.data.total !== undefined ? res.data.total : (res.data.employees?.length || 0));
    } catch {
      // ignore
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search.trim()) params.set('search', search.trim());
    if (filterDept) params.set('department_id', filterDept);
    if (filterBranch) params.set('branch_id', filterBranch);
    if (filterStatus) params.set('status', filterStatus);

    Promise.all([
      api.get(`/api/admin/employees?${params}`),
      api.get('/api/admin/departments'),
      api.get('/api/admin/branches')
    ]).then(([emp, dept, br]) => {
      setEmployees(emp.data.employees || []);
      setTotal(emp.data.total || 0);
      setDepartments(dept.data.departments || []);
      setBranches(br.data.branches || []);
    }).catch(() => setError(`Failed to load ${terms?.memberPlural?.toLowerCase() || 'employees'}.`))
      .finally(() => setLoading(false));

    fetchRecycleBinCount();
  }, [page, search, filterDept, filterBranch, filterStatus, terms, fetchRecycleBinCount]);

  useEffect(() => {
    const handler = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(handler);
  }, [load]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, filterDept, filterBranch, filterStatus]);

  const allVisibleSelected = employees.length > 0 && employees.every(e => selectedIds.includes(e.id));
  const someVisibleSelected = employees.some(e => selectedIds.includes(e.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !employees.some(e => e.id === id)));
    } else {
      const currentIds = employees.map(e => e.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const toggleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleStatusChange = async (emp, status) => {
    try {
      await api.patch(`/api/admin/employees/${emp.id}/status`, { account_status: status });
      const verb = status === 'ACTIVE' ? 'activated' : status === 'SUSPENDED' ? 'suspended' : 'deactivated';
      show(`${terms?.memberSingular || 'Employee'} ${verb}.`);
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to update status.', 'error');
    }
    setConfirmStatus(null);
  };

  const handleDelete = async (emp) => {
    try {
      await api.delete(`/api/admin/employees/${emp.id}`);
      show(`${terms?.memberSingular || 'Employee'} moved to Recycle Bin.`);
      setConfirmDelete(null);
      setSelectedIds(prev => prev.filter(item => item !== emp.id));
      load();
      fetchRecycleBinCount();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to remove record.', 'error');
    }
  };

  const handleRemoveAll = async () => {
    try {
      const res = await api.post('/api/admin/employees/remove-all', { all: true });
      show(res.data.message || `All ${terms?.memberPlural?.toLowerCase() || 'records'} moved to Recycle Bin.`);
      setConfirmRemoveAll(false);
      setSelectedIds([]);
      setSelectionMode(false);
      load();
      fetchRecycleBinCount();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to remove all records.', 'error');
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/api/admin/employees/remove-all', { ids: selectedIds });
      show(res.data.message || `${selectedIds.length} records moved to Recycle Bin.`);
      setConfirmRemoveSelected(false);
      setSelectedIds([]);
      setSelectionMode(false);
      load();
      fetchRecycleBinCount();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to remove selected records.', 'error');
    }
  };

  const openRecycleBin = async () => {
    setRecycleBinOpen(true);
    setRecycleBinLoading(true);
    try {
      const res = await api.get('/api/admin/employees/recycle-bin');
      const list = res.data.employees || [];
      setRecycleBinList(list);
      setRecycleBinCount(list.length);
    } catch {
      show('Failed to load recycle bin.', 'error');
    } finally {
      setRecycleBinLoading(false);
    }
  };

  const handleRestore = async (emp) => {
    try {
      await api.post(`/api/admin/employees/${emp.id}/restore`);
      show(`${terms?.memberSingular || 'Employee'} restored successfully.`);
      setRecycleBinList(prev => prev.filter(item => item.id !== emp.id));
      setRecycleBinCount(prev => Math.max(0, prev - 1));
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to restore record.', 'error');
    }
  };

  const handlePermanentDelete = async (emp) => {
    try {
      await api.delete(`/api/admin/employees/${emp.id}/permanent`);
      show(`${terms?.memberSingular || 'Employee'} permanently deleted.`, 'info');
      setConfirmPermanentDelete(null);
      setRecycleBinList(prev => prev.filter(item => item.id !== emp.id));
      setRecycleBinCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      show(err.response?.data?.message || 'Failed to permanently delete record.', 'error');
    }
  };

  const handleRestoreAll = async () => {
    try {
      const res = await api.post('/api/admin/employees/recycle-bin/restore-all');
      show(res.data.message || 'All records restored successfully.');
      setConfirmRestoreAll(false);
      setRecycleBinList([]);
      setRecycleBinCount(0);
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Failed to restore all.', 'error');
    }
  };

  const handleEmptyBin = async () => {
    try {
      const res = await api.delete('/api/admin/employees/recycle-bin/empty');
      show(res.data.message || 'Recycle Bin emptied successfully.', 'info');
      setConfirmEmptyBin(false);
      setRecycleBinList([]);
      setRecycleBinCount(0);
    } catch (err) {
      show(err.response?.data?.message || 'Failed to empty recycle bin.', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 10) {
      show('Password must be at least 10 characters.', 'error');
      return;
    }
    try {
      await api.post(`/api/admin/employees/${resetModal.id}/reset-password`, { new_password: newPassword });
      show('Password reset successfully!');
      setResetModal(null);
      setNewPassword('');
    } catch (err) {
      show(err.response?.data?.message || 'Failed to reset password.', 'error');
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return show('Please select an Excel or CSV file first.', 'error');
    setBulkLoading(true);
    try {
      const json = await parseSpreadsheet(bulkFile);
      if (json.length === 0) return show('File seems empty or missing data.', 'error');

      const emps = json.map(row => {
        const emp = {};
        for (const key in row) {
          emp[key.trim().toLowerCase()] = row[key];
        }
        return emp;
      }).filter(emp => emp.employee_id && emp.employee_name && emp.date_of_birth);

      if (emps.length === 0) {
        return show('No valid records found. Ensure required columns are present (employee_id, employee_name, date_of_birth).', 'error');
      }

      const res = await api.post('/api/admin/employees/bulk', { employees: emps, updateExisting });
      const { addedCount = 0, updatedCount = 0, skipped = [] } = res.data;

      if (addedCount > 0 || updatedCount > 0) {
        show(`Success! ${addedCount} added, ${updatedCount} updated.`);
      }
      if (skipped.length > 0) {
        show(`${skipped.length} skipped: ${skipped[0]?.reason || 'duplicate or invalid'}`, 'warning');
      }
      if (addedCount === 0 && updatedCount === 0 && skipped.length === 0) {
        show('No records were modified.', 'info');
      }

      setBulkModal(false);
      setBulkFile(null);
      load();
    } catch (err) {
      show(err.response?.data?.message || err.message || 'Failed to parse or upload file.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const memberPlural = terms?.memberPlural || 'Employees';
  const memberSingular = terms?.memberSingular || 'Employee';

  // Build columns dynamically: only show checkbox column when selectionMode is ON
  const columns = [];

  if (selectionMode) {
    columns.push({
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          ref={input => {
            if (input) input.indeterminate = someVisibleSelected && !allVisibleSelected;
          }}
          onChange={toggleSelectAll}
          title="Select all on this page"
          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
        />
      ),
      cellStyle: { width: '40px' },
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => toggleSelectRow(row.id, e)}
          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
        />
      )
    });
  }

  columns.push(
    { key: 'employee_id', label: terms?.memberIdLabel || 'Employee ID', cellStyle: { fontFamily: 'monospace', color: '#1e40af', fontWeight: '700' } },
    { key: 'employee_name', label: 'Name', render: v => <span style={{ fontWeight: '600', color: '#0f172a' }}>{v}</span> },
    { key: 'department_name', label: 'Department', render: v => v || '—' },
    { key: 'branch_name', label: 'Branch', render: v => v || '—' },
    { key: 'designation_name', label: terms?.roleOrDesignationLabel || 'Designation', render: v => v || '—' },
    { key: 'account_status', label: 'Status', render: v => <Badge status={v} /> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Link to={`/admin/employees/${row.id}/edit`}><Btn size="sm" variant="ghost" title={`Edit ${memberSingular}`}>✏️</Btn></Link>
        {row.account_status === 'ACTIVE' && (
          <>
            <Btn size="sm" variant="warning" title="Deactivate" onClick={() => setConfirmStatus({ emp: row, status: 'INACTIVE' })}>⏸️</Btn>
            <Btn size="sm" variant="danger" title="Suspend" onClick={() => setConfirmStatus({ emp: row, status: 'SUSPENDED' })}>⛔</Btn>
          </>
        )}
        {row.account_status === 'INACTIVE' && (
          <>
            <Btn size="sm" variant="success" title="Activate" onClick={() => setConfirmStatus({ emp: row, status: 'ACTIVE' })}>▶️</Btn>
            <Btn size="sm" variant="danger" title="Suspend" onClick={() => setConfirmStatus({ emp: row, status: 'SUSPENDED' })}>⛔</Btn>
          </>
        )}
        {row.account_status === 'SUSPENDED' && (
          <>
            <Btn size="sm" variant="success" title="Activate / Reinstate" onClick={() => setConfirmStatus({ emp: row, status: 'ACTIVE' })}>▶️</Btn>
            <Btn size="sm" variant="warning" title="Deactivate" onClick={() => setConfirmStatus({ emp: row, status: 'INACTIVE' })}>⏸️</Btn>
          </>
        )}
        <Btn size="sm" variant="ghost" title="Reset Password" onClick={() => { setResetModal(row); setNewPassword(''); }}>🔑</Btn>
        <Btn size="sm" variant="danger" title={`Remove ${memberSingular}`} onClick={() => setConfirmDelete(row)}>🗑️</Btn>
      </div>
    )}
  );

  return (
    <div>
      <PageHeader
        title={memberPlural}
        subtitle={`${total} total ${memberPlural.toLowerCase()}`}
        action={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn
              variant="outline"
              onClick={openRecycleBin}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              🗑️ Recycle Bin
              {recycleBinCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  lineHeight: '16px'
                }}>
                  {recycleBinCount}
                </span>
              )}
            </Btn>

            {/* Click to choose remove actions (Select to remove or Remove all) */}
            <Btn
              variant={selectionMode ? 'secondary' : 'outline'}
              onClick={() => {
                if (selectionMode) {
                  exitSelectionMode();
                } else {
                  setDeleteOptionsModalOpen(true);
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {selectionMode ? '✕ Cancel Selection' : '⚙️ Manage'}
            </Btn>

            <Btn variant="outline" onClick={handleBulkClick}>📤 Bulk Import</Btn>
            <Link to="/admin/employees/add" onClick={handleAddClick}><Btn>➕ Add {memberSingular}</Btn></Link>
          </div>
        }
      />

      {!isOrgConfigured && (
        <div style={{ marginBottom: '20px' }}>
          <Alert type="warning">
            Organization profile has not been created yet. Please <Link to="/admin/organization" style={{ color: 'inherit', fontWeight: '700', textDecoration: 'underline' }}>create your organization profile</Link> before adding {memberPlural.toLowerCase()}.
          </Alert>
        </div>
      )}

      {/* Selection Mode Action Banner */}
      {selectionMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px' }}>
              ☑️ Selection Mode:
            </span>
            <span style={{ color: '#1e3a8a', fontSize: '13px' }}>
              {selectedIds.length} {selectedIds.length === 1 ? memberSingular.toLowerCase() : memberPlural.toLowerCase()} selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Btn size="sm" variant="outline" onClick={toggleSelectAll}>
              {allVisibleSelected ? 'Deselect All Visible' : 'Select All Visible'}
            </Btn>
            <Btn
              size="sm"
              variant="danger"
              disabled={selectedIds.length === 0}
              onClick={() => setConfirmRemoveSelected(true)}
            >
              🗑️ Remove Selected ({selectedIds.length})
            </Btn>
            <Btn size="sm" variant="ghost" onClick={exitSelectionMode}>
              ✕ Exit
            </Btn>
          </div>
        </div>
      )}

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search by name or ${terms?.memberIdLabel?.toLowerCase() || 'employee id'}...`} />
          <Select label="" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ marginBottom: 0 }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
          </Select>
          <Select label="" value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ marginBottom: 0 }}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
          </Select>
          <Select label="" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ marginBottom: 0 }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </div>

        {loading ? <LoadingState message={`Loading ${memberPlural.toLowerCase()}...`} /> :
         error ? <ErrorState message={error} onRetry={load} /> :
         employees.length === 0 ? <EmptyState icon="👥" title={`No ${memberPlural.toLowerCase()} found`} desc={`Add your first ${memberSingular.toLowerCase()}`} action={<Link to="/admin/employees/add"><Btn>➕ Add {memberSingular}</Btn></Link>} /> :
         <DataTable columns={columns} rows={employees} />}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
            <Btn variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
            <Btn variant="ghost" size="sm" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next →</Btn>
          </div>
        )}
      </Card>

      {/* Choice Modal: Opens when user clicks "⚙️ Manage" */}
      <Modal
        open={deleteOptionsModalOpen}
        onClose={() => setDeleteOptionsModalOpen(false)}
        title={`Manage ${memberPlural}`}
        maxWidth="540px"
      >
        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>
          Choose an action to perform on your {memberPlural.toLowerCase()} records:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Choice 1: Select multiple records to remove */}
          <div
            onClick={() => {
              setDeleteOptionsModalOpen(false);
              setSelectionMode(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
          >
            <div style={{ fontSize: '24px', width: '42px', height: '42px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ☑️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                Select Specific {memberPlural} to Remove
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                Turn on selection checkboxes to pick specific records or select visible items to remove.
              </div>
            </div>
            <span style={{ fontSize: '18px', color: '#94a3b8' }}>›</span>
          </div>

          {/* Choice 2: Remove All records */}
          <div
            onClick={() => {
              setDeleteOptionsModalOpen(false);
              setConfirmRemoveAll(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              background: '#fff1f2',
              cursor: total > 0 ? 'pointer' : 'not-allowed',
              opacity: total > 0 ? 1 : 0.6,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { if (total > 0) { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; } }}
            onMouseLeave={e => { if (total > 0) { e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.background = '#fff1f2'; } }}
          >
            <div style={{ fontSize: '24px', width: '42px', height: '42px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🗑️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '15px' }}>
                Remove All {memberPlural} ({total})
              </div>
              <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '3px' }}>
                Move all active records to the Recycle Bin. You will be asked to confirm before removing.
              </div>
            </div>
            <span style={{ fontSize: '18px', color: '#f87171' }}>›</span>
          </div>

          {/* Choice 3: Recycle Bin */}
          <div
            onClick={() => {
              setDeleteOptionsModalOpen(false);
              openRecycleBin();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#ecfdf5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
          >
            <div style={{ fontSize: '24px', width: '42px', height: '42px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ♻️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                Open Recycle Bin ({recycleBinCount} items)
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                View deleted {memberPlural.toLowerCase()}, restore records, or permanently erase them.
              </div>
            </div>
            <span style={{ fontSize: '18px', color: '#94a3b8' }}>›</span>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setDeleteOptionsModalOpen(false)}>Close</Btn>
        </div>
      </Modal>

      {/* Confirm Status Change (Activate / Deactivate / Suspend) */}
      <ConfirmDialog
        open={!!confirmStatus}
        title={
          confirmStatus?.status === 'ACTIVE'
            ? `Activate ${memberSingular}`
            : confirmStatus?.status === 'SUSPENDED'
            ? `Suspend ${memberSingular}`
            : `Deactivate ${memberSingular}`
        }
        message={
          confirmStatus?.status === 'SUSPENDED'
            ? `Are you sure you want to suspend "${confirmStatus?.emp?.employee_name}" (${confirmStatus?.emp?.employee_id})? Suspended ${memberPlural.toLowerCase()} will have active sessions terminated and cannot log in or participate in elections.`
            : confirmStatus?.status === 'ACTIVE'
            ? `Are you sure you want to activate "${confirmStatus?.emp?.employee_name}"?`
            : `Are you sure you want to deactivate "${confirmStatus?.emp?.employee_name}"?`
        }
        variant={confirmStatus?.status === 'ACTIVE' ? 'success' : 'danger'}
        confirmText={
          confirmStatus?.status === 'ACTIVE'
            ? 'Activate'
            : confirmStatus?.status === 'SUSPENDED'
            ? 'Suspend'
            : 'Deactivate'
        }
        onConfirm={() => handleStatusChange(confirmStatus.emp, confirmStatus.status)}
        onCancel={() => setConfirmStatus(null)}
      />

      {/* Confirm Remove Single Record */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={`Remove ${memberSingular}`}
        message={`Are you sure you want to remove "${confirmDelete?.employee_name}" (${confirmDelete?.employee_id})? This will move the record to the Recycle Bin.`}
        variant="danger"
        confirmText={`Remove ${memberSingular}`}
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Confirm Remove All Records */}
      <ConfirmDialog
        open={confirmRemoveAll}
        title={`Remove All ${memberPlural}?`}
        message={`Are you sure you want to remove ALL ${total} ${memberPlural.toLowerCase()}? They will be moved to the Recycle Bin where you can restore them or permanently delete them.`}
        variant="danger"
        confirmText="Yes, Remove All"
        onConfirm={handleRemoveAll}
        onCancel={() => setConfirmRemoveAll(false)}
      />

      {/* Confirm Remove Selected Records */}
      <ConfirmDialog
        open={confirmRemoveSelected}
        title={`Remove ${selectedIds.length} Selected ${memberPlural}?`}
        message={`Are you sure you want to move the ${selectedIds.length} selected ${memberPlural.toLowerCase()} to the Recycle Bin?`}
        variant="danger"
        confirmText="Yes, Remove Selected"
        onConfirm={handleRemoveSelected}
        onCancel={() => setConfirmRemoveSelected(false)}
      />

      {/* Recycle Bin Modal */}
      <Modal
        open={recycleBinOpen}
        onClose={() => setRecycleBinOpen(false)}
        title={`🗑️ Recycle Bin (${recycleBinList.length})`}
        maxWidth="900px"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            Deleted {memberPlural.toLowerCase()} remain here until restored or permanently removed.
          </p>
          {recycleBinList.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn size="sm" variant="outline" onClick={() => setConfirmRestoreAll(true)}>
                ↩️ Restore All
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => setConfirmEmptyBin(true)}>
                🗑️ Delete All / Empty Bin
              </Btn>
            </div>
          )}
        </div>

        {recycleBinLoading ? (
          <LoadingState message="Loading recycle bin..." />
        ) : recycleBinList.length === 0 ? (
          <EmptyState
            icon="🗑️"
            title="Recycle Bin is Empty"
            desc={`No deleted ${memberPlural.toLowerCase()} in the bin.`}
          />
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <DataTable
              columns={[
                { key: 'employee_id', label: terms?.memberIdLabel || 'ID', cellStyle: { fontFamily: 'monospace', color: '#1e40af', fontWeight: '700' } },
                { key: 'employee_name', label: 'Name', render: v => <span style={{ fontWeight: '600', color: '#0f172a' }}>{v}</span> },
                { key: 'department_name', label: 'Department', render: v => v || '—' },
                { key: 'deleted_at', label: 'Deleted At', render: v => v ? new Date(v).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—' },
                { key: 'actions', label: 'Actions', render: (_, row) => (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Btn size="sm" variant="success" onClick={() => handleRestore(row)}>
                      ↩️ Restore
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => setConfirmPermanentDelete(row)}>
                      ❌ Delete Forever
                    </Btn>
                  </div>
                )}
              ]}
              rows={recycleBinList}
            />
          </div>
        )}
      </Modal>

      {/* Confirm Permanent Delete Single Record */}
      <ConfirmDialog
        open={!!confirmPermanentDelete}
        title={`Permanently Delete ${memberSingular}`}
        message={`Are you sure you want to permanently delete "${confirmPermanentDelete?.employee_name}" (${confirmPermanentDelete?.employee_id})? This action CANNOT be undone.`}
        variant="danger"
        confirmText="Delete Forever"
        onConfirm={() => handlePermanentDelete(confirmPermanentDelete)}
        onCancel={() => setConfirmPermanentDelete(null)}
      />

      {/* Confirm Restore All */}
      <ConfirmDialog
        open={confirmRestoreAll}
        title={`Restore All ${memberPlural}`}
        message={`Are you sure you want to restore all ${recycleBinList.length} ${memberPlural.toLowerCase()} back to active records?`}
        variant="primary"
        confirmText="Restore All"
        onConfirm={handleRestoreAll}
        onCancel={() => setConfirmRestoreAll(false)}
      />

      {/* Confirm Delete All / Empty Recycle Bin */}
      <ConfirmDialog
        open={confirmEmptyBin}
        title="Delete All from Recycle Bin"
        message={`Are you sure you want to permanently delete ALL ${recycleBinList.length} records in the Recycle Bin? This action CANNOT be undone and will permanently erase their data.`}
        variant="danger"
        confirmText="Yes, Permanently Delete All"
        onConfirm={handleEmptyBin}
        onCancel={() => setConfirmEmptyBin(false)}
      />

      {/* Reset Password Modal */}
      <Modal open={!!resetModal} onClose={() => setResetModal(null)} title={`Reset ${memberSingular} Password`}>
        <p style={{ color: '#64748b', marginTop: 0 }}>Reset password for <strong>{resetModal?.employee_name}</strong> ({resetModal?.employee_id})</p>
        <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 10 characters" required />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setResetModal(null)}>Cancel</Btn>
          <Btn onClick={handleResetPassword}>🔑 Reset Password</Btn>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title={`Bulk Import ${memberPlural}`}>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Upload an <strong>Excel (.xlsx) or CSV file</strong> to bulk import {memberPlural.toLowerCase()}.
        </p>
        <div style={{ marginBottom: '16px', fontSize: '13px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>File Columns Format</span>
            <a 
              href="/employees_sample.csv" 
              download="employees_sample.csv"
              style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              📥 Download Sample CSV
            </a>
          </div>
          <div><strong>Required Columns:</strong></div>
          <code style={{ color: '#be185d', display: 'block', margin: '3px 0' }}>employee_id, employee_name, date_of_birth</code>
          <div style={{ marginTop: '6px' }}><strong>Optional Columns:</strong></div>
          <code style={{ color: '#1e40af', display: 'block', margin: '3px 0' }}>gender, personal_email, official_email, phone_number</code>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', marginBottom: '16px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={updateExisting} 
            onChange={e => setUpdateExisting(e.target.checked)} 
            style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
          />
          <span><strong>Update existing records</strong> if {terms?.memberIdLabel || 'Employee ID'} already exists</span>
        </label>

        <input 
          type="file" 
          accept=".csv, .xlsx, .xls" 
          onChange={e => setBulkFile(e.target.files[0])} 
          style={{ marginBottom: '24px', display: 'block', width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }} 
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setBulkModal(false)}>Cancel</Btn>
          <Btn onClick={handleBulkUpload} disabled={bulkLoading}>
            {bulkLoading ? '⏳ Uploading...' : '📤 Import Now'}
          </Btn>
        </div>
      </Modal>

      <OrgRequiredModal open={orgModalOpen} onClose={() => setOrgModalOpen(false)} feature="employees" />
      <ToastContainer />
    </div>
  );
}
