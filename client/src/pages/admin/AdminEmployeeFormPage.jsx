import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';
import { PageHeader, Btn, Input, Select, Card, Alert, LoadingState, ErrorState, SectionTitle, useToast, OrgRequiredNotice, ConfirmDialog } from '../../components/ui';

export default function AdminEmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOrgConfigured, loading: orgLoading, terms } = useOrg();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const { show, ToastContainer } = useToast();

  const memberSingular = terms?.memberSingular || 'Employee';
  const memberPlural = terms?.memberPlural || 'Employees';
  const memberIdLabel = terms?.memberIdLabel || 'Employee ID';
  const roleLabel = terms?.roleOrDesignationLabel || 'Designation';
  const rolePlaceholder = terms?.roleOrDesignationPlaceholder || 'e.g. Lead Software Architect';
  const memberTypeLabel = terms?.memberTypeLabel || 'Employee Type';

  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [form, setForm] = useState({
    employee_id: '', employee_name: '', date_of_birth: '', gender: 'MALE',
    personal_email: '', official_email: '', phone_number: '',
    department_id: '', branch_id: '', location_id: '', designation: '',
    employee_type: 'FULL_TIME', joining_date: '', password: '', account_status: 'ACTIVE'
  });

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/departments'),
      api.get('/api/admin/branches'),
      api.get('/api/admin/locations'),
      api.get('/api/admin/designations')
    ]).then(([d, b, l, des]) => {
      setDepartments(d.data.departments || []);
      setBranches(b.data.branches || []);
      setLocations(l.data.locations || []);
      setDesignations(des.data.designations || []);
    }).catch(console.error);

    if (id) {
      api.get(`/api/admin/employees/${id}`)
        .then(r => {
          const e = r.data.employee;
          setForm({
            employee_id: e.employee_id, employee_name: e.employee_name,
            date_of_birth: e.date_of_birth ? e.date_of_birth.split('T')[0] : '',
            gender: e.gender || 'MALE', personal_email: e.personal_email || '',
            official_email: e.official_email || '', phone_number: e.phone_number || '',
            department_id: e.department_id || '', branch_id: e.branch_id || '',
            location_id: e.location_id || '',
            designation: e.designation_name || '',
            employee_type: e.employee_type || 'FULL_TIME',
            joining_date: e.joining_date ? e.joining_date.split('T')[0] : '',
            account_status: e.account_status || 'ACTIVE',
            password: ''
          });
        })
        .catch(() => setError(`Failed to load ${memberSingular.toLowerCase()} details.`))
        .finally(() => setLoading(false));
    }
  }, [id, memberSingular]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id && !isOrgConfigured) {
      setFormError(`Please create an organization profile before adding ${memberPlural.toLowerCase()}.`);
      return;
    }
    if (!form.employee_id || !form.employee_name || !form.date_of_birth) {
      setFormError(`${memberIdLabel}, Name, and Date of Birth are required.`); return;
    }
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        password: form.password ? form.password.trim() : undefined,
        custom_designation: form.designation ? form.designation.trim() : undefined,
        // Strip empty strings for nullable date/email fields so server receives null, not ''
        joining_date: form.joining_date || undefined,
        personal_email: form.personal_email || undefined,
        official_email: form.official_email || undefined,
        phone_number: form.phone_number || undefined,
        department_id: form.department_id || undefined,
        branch_id: form.branch_id || undefined,
        location_id: form.location_id || undefined,
      };
      if (id) {
        await api.put(`/api/admin/employees/${id}`, payload);
        show(`${memberSingular} updated successfully!`);
      } else {
        await api.post('/api/admin/employees', payload);
        show(`${memberSingular} created successfully!`);
      }
      navigate('/admin/employees');
    } catch (err) {
      const respData = err.response?.data;
      if (respData?.errors && respData.errors.length > 0) {
        setFormError(respData.errors.map(item => item.message).join(' '));
      } else {
        setFormError(respData?.message || `Failed to save ${memberSingular.toLowerCase()}.`);
      }
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await api.delete(`/api/admin/employees/${id}`);
      show(`${memberSingular} moved to Recycle Bin.`);
      setDeleteConfirmOpen(false);
      setTimeout(() => navigate('/admin/employees'), 1000);
    } catch (err) {
      show(err.response?.data?.message || `Failed to remove ${memberSingular.toLowerCase()}.`, 'error');
      setSaving(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) return <LoadingState message={`Loading ${memberSingular.toLowerCase()} details...`} />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  if (!id && !orgLoading && !isOrgConfigured) {
    return (
      <div>
        <ToastContainer />
        <PageHeader title={`Add ${memberSingular}`} subtitle={`Enter ${memberSingular.toLowerCase()} details and organization placement`}
          action={<Link to="/admin/employees"><Btn variant="ghost">← Back to List</Btn></Link>} />
        <OrgRequiredNotice title="Organization Profile Required" feature={`adding ${memberPlural.toLowerCase()}`} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={id ? `Edit ${memberSingular}` : `Add ${memberSingular}`} subtitle={`Enter ${memberSingular.toLowerCase()} details and organization placement`}
        action={<Link to="/admin/employees"><Btn variant="ghost">← Back to List</Btn></Link>} />

      <form onSubmit={handleSubmit}>
        {formError && <Alert type="error">{formError}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Personal Info */}
          <Card>
            <SectionTitle>Personal Information</SectionTitle>
            <Input label={memberIdLabel} name="employee_id" value={form.employee_id} onChange={handleChange} required placeholder={terms?.memberIdPlaceholder || "e.g. EMP1001"} disabled={!!id} />
            <Input label={terms?.memberNameLabel || "Full Name"} name="employee_name" value={form.employee_name} onChange={handleChange} required placeholder="Full Name" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} required />
              <Select label="Gender" name="gender" value={form.gender} onChange={handleChange}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <Input label="Phone Number" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="+1 234 567 8900" />
            <Input label="Personal Email" name="personal_email" type="email" value={form.personal_email} onChange={handleChange} placeholder="john.doe@gmail.com" />
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Organization Info */}
            <Card>
              <SectionTitle>Organization Placement</SectionTitle>
              <Input label="Official Email" name="official_email" type="email" value={form.official_email} onChange={handleChange} placeholder="john.doe@company.com" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Select label="Department" name="department_id" value={form.department_id} onChange={handleChange}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} disabled={!d.is_active && form.department_id !== d.id}>
                      {d.department_name}{!d.is_active ? ' (Inactive)' : ''}
                    </option>
                  ))}
                </Select>

                <Input
                  label={roleLabel}
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder={rolePlaceholder}
                  list="designations-list"
                />
                <datalist id="designations-list">
                  {designations.map(d => <option key={d.id} value={d.designation_name} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Select label="Branch" name="branch_id" value={form.branch_id} onChange={handleChange}>
                  <option value="">— Select Branch —</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id} disabled={!b.is_active && form.branch_id !== b.id}>
                      {b.branch_name}{!b.is_active ? ' (Inactive)' : ''}
                    </option>
                  ))}
                </Select>
                <Select label="Location" name="location_id" value={form.location_id} onChange={handleChange}>
                  <option value="">— Select Location —</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id} disabled={!l.is_active && form.location_id !== l.id}>
                      {l.location_name}{!l.is_active ? ' (Inactive)' : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: id ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
                <Select label={memberTypeLabel} name="employee_type" value={form.employee_type} onChange={handleChange}>
                  {terms?.isSchoolOrCollege ? (
                    <>
                      <option value="FULL_TIME">Regular Student</option>
                      <option value="PART_TIME">Part-Time / Distance</option>
                      <option value="CONTRACT">Exchange Student</option>
                      <option value="INTERN">Intern / Researcher</option>
                    </>
                  ) : (
                    <>
                      <option value="FULL_TIME">Full-Time</option>
                      <option value="PART_TIME">Part-Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                    </>
                  )}
                </Select>
                <Input label="Joining Date" name="joining_date" type="date" value={form.joining_date} onChange={handleChange} />
                {id && (
                  <Select label="Account Status" name="account_status" value={form.account_status || 'ACTIVE'} onChange={handleChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </Select>
                )}
              </div>
            </Card>

            {/* Login Credentials (Only for new) */}
            {!id && (
              <Card>
                <SectionTitle>Login Credentials</SectionTitle>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    🔑
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>
                      Default Password: Same as {memberIdLabel}
                    </div>
                    <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                      The {memberSingular.toLowerCase()} will use their {memberIdLabel} (<strong style={{ fontFamily: 'monospace' }}>{form.employee_id || terms?.memberIdPlaceholder || 'e.g. STU1001'}</strong>) as their password to log in.
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          {id ? (
            <Btn type="button" variant="danger" onClick={() => setDeleteConfirmOpen(true)}>
              🗑️ Remove {memberSingular}
            </Btn>
          ) : <div />}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/admin/employees"><Btn variant="ghost">Cancel</Btn></Link>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : id ? `Update ${memberSingular}` : `Create ${memberSingular}`}</Btn>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={`Remove ${memberSingular}`}
        message={`Are you sure you want to remove "${form.employee_name}" (${form.employee_id})? This will move them to the Recycle Bin.`}
        variant="danger"
        confirmText={`Remove ${memberSingular}`}
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => !saving && setDeleteConfirmOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
