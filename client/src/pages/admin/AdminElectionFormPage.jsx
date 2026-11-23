import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Btn, Input, Select, Textarea, Card, Alert, LoadingState, ErrorState, SectionTitle, useToast, OrgRequiredNotice } from '../../components/ui';

export default function AdminElectionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOrgConfigured, loading: orgLoading, terms } = useOrg();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const { show, ToastContainer } = useToast();

  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // Candidate input for new candidate
  const [candEmployeeId, setCandEmployeeId] = useState('');
  const [candDescription, setCandDescription] = useState('');

  // Safely extract YYYY-MM-DDTHH:mm string without timezone conversion drift
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const s = String(dateStr).trim();
    if (s.includes('T')) return s.slice(0, 16);
    if (s.includes(' ')) return s.replace(' ', 'T').slice(0, 16);
    return s.slice(0, 16);
  };

  const [form, setForm] = useState({
    title: '', description: '', election_type: 'General',
    start_date: '', end_date: '', status: 'DRAFT',
    department_id: '', branch_id: '', location_id: ''
  });

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/departments'),
      api.get('/api/admin/branches'),
      api.get('/api/admin/locations'),
      api.get('/api/admin/employees?limit=100&status=ACTIVE')
    ]).then(([d, b, l, emp]) => {
      setDepartments(d.data.departments || []);
      setBranches(b.data.branches || []);
      setLocations(l.data.locations || []);
      setEmployees(emp.data.employees || []);
    }).catch(console.error);

    if (id) {
      Promise.all([
        api.get(`/api/admin/elections/${id}`),
        api.get(`/api/admin/candidates?election_id=${id}`)
      ])
        .then(([r, c]) => {
          const e = r.data.election;
          const elig = r.data.eligibility?.[0] || {};
          setForm({
            title: e.title, description: e.description || '', election_type: e.election_type || '',
            start_date: formatDateTime(e.start_date), end_date: formatDateTime(e.end_date), status: e.status,
            department_id: elig.department_id || '', branch_id: elig.branch_id || '', location_id: elig.location_id || ''
          });
          setCandidates(c.data.candidates || []);
        })
        .catch(() => setError('Failed to load election details.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!candEmployeeId) return;

    const emp = employees.find(x => x.employee_id === candEmployeeId);
    if (!emp) return;

    if (candidates.some(c => c.employee_id === candEmployeeId)) {
      setFormError(`Employee ${emp.employee_name} (${candEmployeeId}) is already added.`);
      return;
    }

    setFormError('');

    // If editing existing election, save to server immediately
    if (id) {
      try {
        const res = await api.post('/api/admin/candidates', {
          election_id: Number(id),
          employee_id: emp.employee_id,
          employee_name: emp.employee_name,
          department_id: emp.department_id || null,
          description: candDescription || null
        });
        setCandidates([...candidates, {
          id: res.data.id,
          election_id: Number(id),
          employee_id: emp.employee_id,
          employee_name: emp.employee_name,
          department_name: emp.department_name,
          description: candDescription
        }]);
        show('Candidate added successfully!');
      } catch (err) {
        setFormError(err.response?.data?.message || 'Failed to add candidate.');
        return;
      }
    } else {
      // Local addition for new election creation
      setCandidates([
        ...candidates,
        {
          employee_id: emp.employee_id,
          employee_name: emp.employee_name,
          department_name: emp.department_name,
          department_id: emp.department_id || null,
          description: candDescription
        }
      ]);
    }

    setCandEmployeeId('');
    setCandDescription('');
  };

  const handleRemoveCandidate = async (cand, index) => {
    if (cand.id) {
      try {
        await api.delete(`/api/admin/candidates/${cand.id}`);
        setCandidates(candidates.filter(c => c.id !== cand.id));
        show('Candidate removed.');
      } catch (err) {
        setFormError(err.response?.data?.message || 'Failed to remove candidate.');
      }
    } else {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id && !isOrgConfigured) {
      setFormError('Please create an organization profile before creating an election.');
      return;
    }
    if (!form.title || !form.start_date || !form.end_date) {
      setFormError('Title, Start Date, and End Date are required.'); return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setFormError('End date must be after the start date.'); return;
    }
    setSaving(true); setFormError('');
    try {
      const payload = { ...form };
      if (!payload.department_id) delete payload.department_id;
      if (!payload.branch_id) delete payload.branch_id;
      if (!payload.location_id) delete payload.location_id;

      let electionId = id;
      if (id) {
        await api.put(`/api/admin/elections/${id}`, payload);
      } else {
        const createRes = await api.post('/api/admin/elections', payload);
        electionId = createRes.data.id;

        // Automatically associate all pending candidates to this newly created election
        for (const cand of candidates) {
          try {
            await api.post('/api/admin/candidates', {
              election_id: electionId,
              employee_id: cand.employee_id,
              employee_name: cand.employee_name,
              department_id: cand.department_id || null,
              description: cand.description || null
            });
          } catch (candErr) {
            console.error('Failed to attach candidate:', candErr);
          }
        }
      }

      show(id ? 'Election updated successfully!' : 'Election and candidates created successfully!');
      setTimeout(() => navigate('/admin/elections'), 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save election.');
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading election details..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  if (!id && !orgLoading && !isOrgConfigured) {
    return (
      <div>
        <ToastContainer />
        <PageHeader title="Create Election" subtitle="Configure voting event details, eligibility, and candidates"
          action={<Link to="/admin/elections"><Btn variant="ghost">← Back to List</Btn></Link>} />
        <OrgRequiredNotice title="Organization Profile Required" feature="creating elections" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={id ? 'Edit Election' : 'Create Election'} subtitle="Configure voting event details, eligibility, and candidates"
        action={<Link to="/admin/elections"><Btn variant="ghost">← Back to List</Btn></Link>} />

      <form onSubmit={handleSubmit}>
        {formError && <Alert type="error">{formError}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Election Details */}
          <Card>
            <SectionTitle>Election Details</SectionTitle>
            <Input label="Election Title" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Employee Representative 2026" />
            <Input label="Election Type" name="election_type" value={form.election_type} onChange={handleChange} placeholder="e.g. General, Board, Committee" />
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Provide details about this election..." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Start Date & Time" name="start_date" type="datetime-local" value={form.start_date} onChange={handleChange} required />
              <Input label="End Date & Time" name="end_date" type="datetime-local" value={form.end_date} onChange={handleChange} required />
            </div>
            {id && (
              <Select label="Status" name="status" value={form.status} onChange={handleChange}>
                <option value="DRAFT">Draft</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            )}
          </Card>

          {/* Eligibility Rules */}
          <Card>
            <SectionTitle>Eligibility Rules</SectionTitle>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>Leave these blank to allow ALL active employees to vote. If you select any criteria, ONLY employees matching the criteria will be able to vote.</p>
            <Select label="Restrict to Department" name="department_id" value={form.department_id} onChange={handleChange}>
              <option value="">— All Departments —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
            </Select>
            <Select label="Restrict to Branch" name="branch_id" value={form.branch_id} onChange={handleChange}>
              <option value="">— All Branches —</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
            </Select>
            <Select label="Restrict to Location" name="location_id" value={form.location_id} onChange={handleChange}>
              <option value="">— All Locations —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
            </Select>
            <Alert type="info">Note: Employees must always be ACTIVE in the system to vote, regardless of these filters.</Alert>
          </Card>
        </div>

        {/* Candidate Roster Section */}
        <div style={{ marginTop: '24px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <SectionTitle style={{ margin: 0 }}>Candidate Roster ({candidates.length})</SectionTitle>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
                  Select active employees to participate as candidates in this election.
                </p>
              </div>
            </div>

            {/* Candidate Quick Add Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 2fr auto',
              gap: '12px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              alignItems: 'end'
            }}>
              <Select
                label={`Select ${terms?.memberSingular || 'Employee'}`}
                value={candEmployeeId}
                onChange={e => setCandEmployeeId(e.target.value)}
                style={{ marginBottom: 0 }}
              >
                <option value="">— Choose a {terms?.memberSingular || 'Employee'} —</option>
                {employees
                  .filter(emp => !candidates.some(c => c.employee_id === emp.employee_id))
                  .map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_name} ({emp.employee_id}) — {emp.department_name || 'General'}
                    </option>
                  ))}
              </Select>

              <Input
                label="Candidate Pitch / Description (Optional)"
                value={candDescription}
                onChange={e => setCandDescription(e.target.value)}
                placeholder="e.g. Campaign vision or profile statement"
                style={{ marginBottom: 0 }}
              />

              <div>
                <Btn
                  type="button"
                  variant="outline"
                  onClick={handleAddCandidate}
                  disabled={!candEmployeeId}
                  style={{ height: '38px', whiteSpace: 'nowrap' }}
                >
                  ➕ Add Candidate
                </Btn>
              </div>
            </div>

            {/* Candidates List */}
            {candidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '28px' }}>👤</span>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '8px 0 0' }}>
                  No candidates added yet. Select employees from the dropdown above to add them to this election.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {candidates.map((cand, idx) => (
                  <div
                    key={cand.employee_id || idx}
                    style={{
                      background: '#fff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                          {cand.employee_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600', fontFamily: 'monospace' }}>
                          {cand.employee_id} {cand.department_name ? `• ${cand.department_name}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(cand, idx)}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          color: '#dc2626',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}
                        title="Remove candidate"
                      >
                        ✕
                      </button>
                    </div>

                    {cand.description && (
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{cand.description}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link to="/admin/elections"><Btn variant="ghost">Cancel</Btn></Link>
          <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : id ? 'Update Election' : 'Create Election'}</Btn>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
}
