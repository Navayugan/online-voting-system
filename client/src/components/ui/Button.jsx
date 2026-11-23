/**
 * components/ui/Button.jsx
 */
import React from 'react';

export const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', style: extStyle }) => {
  const base = { display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1 };
  const sizes = { sm: { padding: '7px 14px', fontSize: '13px' }, md: { padding: '10px 20px', fontSize: '14px' }, lg: { padding: '13px 26px', fontSize: '15px' } };
  const variants = {
    primary: { background: 'linear-gradient(135deg, #1e40af, #7c3aed)', color: '#fff' },
    danger: { background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff' },
    ghost: { background: 'transparent', color: '#475569', border: '1px solid #e2e8f0' },
    outline: { background: '#ffffff', color: '#1e40af', border: '1px solid #cbd5e1' },
    success: { background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff' },
    warning: { background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#fff' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...extStyle }}>
      {children}
    </button>
  );
};
