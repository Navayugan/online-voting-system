/**
 * components/ui/Alert.jsx
 */
import React from 'react';

export const Alert = ({ type = 'info', children }) => {
  const styles = {
    info: { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
    success: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
    error: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
    warning: { bg: '#fef9c3', color: '#713f12', border: '#fde047' },
  };
  const s = styles[type];
  return (
    <div style={{ padding: '12px 16px', borderRadius: '10px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: '14px', marginBottom: '16px', fontWeight: '500' }}>
      {children}
    </div>
  );
};
