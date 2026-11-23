import React, { useEffect } from 'react';

export const Modal = ({ open, onClose, title, children, maxWidth = '560px' }) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: '24px 28px' }}>{children}</div>
      </div>
    </div>
  );
};
