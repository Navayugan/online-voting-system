/**
 * components/ui/useToast.jsx
 */
import React, { useState } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  const ToastContainer = () => (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => {
        const colors = { success: { bg: '#059669', icon: '✅' }, error: { bg: '#dc2626', icon: '❌' }, info: { bg: '#1e40af', icon: 'ℹ️' } };
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{ padding: '14px 20px', borderRadius: '12px', background: c.bg, color: '#fff', fontSize: '14px', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px', animation: 'slideIn 0.3s ease' }}>
            <style>{`@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
            <span>{c.icon}</span> {t.message}
          </div>
        );
      })}
    </div>
  );
  return { show, ToastContainer };
};
