/**
 * components/ui/Badge.jsx
 */
import React from 'react';

export const Badge = ({ status }) => {
  const map = {
    ACTIVE: { bg: '#d1fae5', color: '#065f46' },
    INACTIVE: { bg: '#f1f5f9', color: '#475569' },
    SUSPENDED: { bg: '#fee2e2', color: '#991b1b' },
    UPCOMING: { bg: '#dbeafe', color: '#1e40af' },
    CLOSED: { bg: '#f1f5f9', color: '#475569' },
    DRAFT: { bg: '#fef9c3', color: '#713f12' },
    CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
    true: { bg: '#d1fae5', color: '#065f46' },
    false: { bg: '#fee2e2', color: '#991b1b' },
  };
  const c = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '100px', background: c.bg, color: c.color, fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
      {String(status)}
    </span>
  );
};
