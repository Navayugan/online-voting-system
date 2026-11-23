import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOrg } from '../../context/OrgContext';

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { org, terms } = useOrg();
  const primary = org?.primary_color || '#1e40af';

  useEffect(() => {
    api.get('/api/employee/profile')
      .then(r => setProfile(r.data.employee))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading profile...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>{error}</div>;

  const DetailRow = ({ label, value }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
      <div style={{ width: '150px', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>{label}</div>
      <div style={{ flex: 1, color: '#0f172a', fontSize: '15px', fontWeight: '500' }}>{value || '—'}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>My Profile</h1>
        <p style={{ color: '#64748b', margin: 0 }}>View your organization details.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${primary}, #7c3aed)`, padding: '40px 32px', color: '#fff', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            {(profile?.employee_name || 'E')[0]}
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px' }}>{profile?.employee_name}</h2>
            <div style={{ display: 'flex', gap: '12px', fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>
              <span>{terms?.memberIdShort || 'ID'}: {profile?.employee_id}</span>
              <span>•</span>
              <span>{profile?.designation_name || terms?.memberSingular || 'Member'}</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {profile?.account_status}
            </span>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>Organization Info</h3>
          <div style={{ marginBottom: '32px' }}>
            <DetailRow label="Department" value={profile?.department_name} />
            <DetailRow label="Branch" value={profile?.branch_name} />
            <DetailRow label="Location" value={profile?.location_name} />
            <DetailRow label={terms?.memberTypeLabel || "Member Type"} value={profile?.employee_type?.replace(/_/g, ' ')} />
            <DetailRow label="Joining Date" value={profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString() : ''} />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>Contact Info</h3>
          <div>
            <DetailRow label="Official Email" value={profile?.official_email} />
            <DetailRow label="Phone Number" value={profile?.phone_number} />
          </div>
        </div>
      </div>
      
      <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
        If any of this information is incorrect, please contact your administrator.
      </p>
    </div>
  );
}
