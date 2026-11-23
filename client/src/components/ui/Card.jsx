/**
 * components/ui/Card.jsx
 */
import React from 'react';

export const Card = ({ children, style }) => (
  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);

export const SectionTitle = ({ children }) => (
  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '12px', marginTop: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
    {children}
  </div>
);
