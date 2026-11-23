import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, Btn, Input, Select, Card, Alert, SectionTitle, useToast, LoadingState, ConfirmDialog } from '../../components/ui';
import { useOrg } from '../../context/OrgContext';

const ORG_TYPES = ['PRIVATE_COMPANY','PUBLIC_COMPANY','EDUCATIONAL_INSTITUTION','COLLEGE','SCHOOL','HOSPITAL','NGO','NON_PROFIT','OTHER'];

export default function AdminOrganizationPage() {
  const { refetch, getOrgTerms } = useOrg();
  const [form, setForm] = useState({
    org_name: '', org_code: '', gstn_number: '', org_type: 'PRIVATE_COMPANY', official_email: '', contact_number: '',
    website: '', established_year: '', address_line1: '', address_line2: '', country: '',
    state: '', district: '', city: '', postal_code: '', primary_color: '#1e40af', secondary_color: '#7c3aed'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const { show, ToastContainer } = useToast();

  const currentTerms = getOrgTerms ? getOrgTerms(form.org_type) : {};

  useEffect(() => {
    api.get('/api/admin/organization').then(r => {
      if (r.data.organization) setForm(prev => ({ ...prev, ...r.data.organization }));
    }).catch(() => setError('Failed to load organization data.')).finally(() => setLoading(false));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.org_name) { setError('Organization name is required.'); return; }
    setError('');
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true); setError('');
    try {
      await api.put('/api/admin/organization', form);
      show('Organization profile updated successfully!');
      setConfirmOpen(false);
      await refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save organization data.');
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading organization profile..." />;

  return (
    <div>
      <PageHeader title="Organization Profile" subtitle="Configure your organization's information and branding" />
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <Card>
            <SectionTitle>Basic Information</SectionTitle>
            <Select label="Organization Type" name="org_type" value={form.org_type} onChange={handleChange} required>
              {ORG_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </Select>
            <Input label="Organization Name" name="org_name" value={form.org_name} onChange={handleChange} required placeholder={currentTerms.orgNamePlaceholder || "e.g. ABC Technologies Pvt Ltd"} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Organization Code" name="org_code" value={form.org_code || ''} onChange={handleChange} placeholder="e.g. ABCTECH" />
              <Input label={currentTerms.taxOrGstnLabel || "Company GSTN Number (Optional)"} name="gstn_number" value={form.gstn_number || ''} onChange={handleChange} placeholder={currentTerms.taxOrGstnPlaceholder || "e.g. 33AAAAA0000A1Z5"} />
            </div>
            <Input label="Official Email" name="official_email" type="email" value={form.official_email || ''} onChange={handleChange} placeholder="admin@company.com" />
            <Input label="Contact Number" name="contact_number" value={form.contact_number || ''} onChange={handleChange} placeholder="+91 98765 43210" />
            <Input label="Website" name="website" value={form.website || ''} onChange={handleChange} placeholder="https://company.com" />
            <Input label="Established Year" name="established_year" type="number" value={form.established_year || ''} onChange={handleChange} placeholder="2010" />
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card>
              <SectionTitle>Address</SectionTitle>
              <Input label="Address Line 1" name="address_line1" value={form.address_line1 || ''} onChange={handleChange} placeholder="123 Main Street" />
              <Input label="Address Line 2" name="address_line2" value={form.address_line2 || ''} onChange={handleChange} placeholder="Suite 100" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input label="City" name="city" value={form.city || ''} onChange={handleChange} placeholder="Chennai" />
                <Input label="District" name="district" value={form.district || ''} onChange={handleChange} placeholder="Chennai" />
                <Input label="State" name="state" value={form.state || ''} onChange={handleChange} placeholder="Tamil Nadu" />
                <Input label="Country" name="country" value={form.country || ''} onChange={handleChange} placeholder="India" />
                <Input label="Postal Code" name="postal_code" value={form.postal_code || ''} onChange={handleChange} placeholder="600001" />
              </div>
            </Card>

            <Card>
              <SectionTitle>Branding</SectionTitle>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: 0 }}>These colors are applied throughout the application.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Primary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" name="primary_color" value={form.primary_color || '#1e40af'} onChange={handleChange} style={{ width: '48px', height: '48px', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', padding: '2px' }} />
                    <Input label="" name="primary_color" value={form.primary_color || '#1e40af'} onChange={handleChange} style={{ marginBottom: 0 }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Secondary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" name="secondary_color" value={form.secondary_color || '#7c3aed'} onChange={handleChange} style={{ width: '48px', height: '48px', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', padding: '2px' }} />
                    <Input label="" name="secondary_color" value={form.secondary_color || '#7c3aed'} onChange={handleChange} style={{ marginBottom: 0 }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Btn type="submit" size="lg" disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Organization'}
          </Btn>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Organization Details"
        message="Please review and confirm the organization information before saving:"
        variant="primary"
        confirmText="Confirm & Save"
        cancelText="Cancel"
        loading={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => !saving && setConfirmOpen(false)}
      >
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Organization Name:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{form.org_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Type:</span>
            <span style={{ color: '#0f172a' }}>{form.org_type?.replace(/_/g, ' ')}</span>
          </div>
          {form.org_code && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Code:</span>
              <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{form.org_code}</span>
            </div>
          )}
          {form.gstn_number && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>{currentTerms.taxOrGstnLabel?.replace(' (Optional)', '') || 'GSTN / Reg No'}:</span>
              <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{form.gstn_number}</span>
            </div>
          )}
          {form.official_email && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Official Email:</span>
              <span style={{ color: '#0f172a' }}>{form.official_email}</span>
            </div>
          )}
          {(form.city || form.state || form.country) && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Location:</span>
              <span style={{ color: '#0f172a' }}>{[form.city, form.state, form.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      </ConfirmDialog>

      <ToastContainer />
    </div>
  );
}
