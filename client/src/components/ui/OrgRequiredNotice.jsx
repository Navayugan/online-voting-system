import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Btn } from './Button';

export const OrgRequiredNotice = ({ title = "Organization Profile Required", feature = "entering these details" }) => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto' }}>
      <Card>
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
            fontSize: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 25px rgba(217, 119, 6, 0.2)'
          }}>
            🏢
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            {title}
          </h2>

          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 8px' }}>
            Before {feature}, you need to configure your organization profile.
          </p>
          <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.6', margin: '0 auto 28px', maxWidth: '460px' }}>
            All elections, employee records, and branches are bound to your organization profile. Please set up your organization name, contact details, and branding first.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn variant="outline" onClick={() => navigate('/admin/dashboard')}>
              ← Back to Dashboard
            </Btn>
            <Btn variant="primary" onClick={() => navigate('/admin/organization')}>
              🏢 Create Organization Profile Now →
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
};
