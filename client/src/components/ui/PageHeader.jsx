/**
 * components/ui/PageHeader.jsx
 */
import React from 'react';

export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>{title}</h1>
      {subtitle && <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);
