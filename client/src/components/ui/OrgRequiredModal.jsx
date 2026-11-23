import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Btn } from './Button';

export const OrgRequiredModal = ({ open, onClose, feature = 'these details' }) => {
  const navigate = useNavigate();

  const handleGoToOrg = () => {
    if (onClose) onClose();
    navigate('/admin/organization');
  };

  return (
    <Modal open={open} onClose={onClose} title="Organization Profile Required" maxWidth="500px">
      <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: '#fef3c7',
          color: '#d97706',
          fontSize: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
          boxShadow: '0 8px 16px rgba(217, 119, 6, 0.15)'
        }}>
          🏢
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>
          Create Organization Profile First
        </h3>

        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
          You must create and configure your organization profile before you can enter {feature}. Legal organization information and branding are required before registering workforce members or running elections.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={handleGoToOrg}>
            🏢 Create Organization Profile →
          </Btn>
        </div>
      </div>
    </Modal>
  );
};
