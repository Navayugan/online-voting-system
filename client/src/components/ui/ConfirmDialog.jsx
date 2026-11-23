/**
 * components/ui/ConfirmDialog.jsx
 */
import React from 'react';
import { Btn } from './Button';

export const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  children
}) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', maxWidth: '460px', width: '90%', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px' }}>{title}</h3>
        {message && <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 16px', lineHeight: 1.6 }}>{message}</p>}
        {children}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>{cancelText}</Btn>
          <Btn variant={variant} onClick={onConfirm} disabled={loading}>
            {loading ? 'Saving...' : confirmText}
          </Btn>
        </div>
      </div>
    </div>
  );
};
