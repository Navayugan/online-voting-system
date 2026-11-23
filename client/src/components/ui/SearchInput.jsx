/**
 * components/ui/SearchInput.jsx
 */
import React from 'react';

export const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => (
  <div style={{ position: 'relative', width: '100%' }}>
    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '15px', pointerEvents: 'none' }}>🔍</span>
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        paddingLeft: '38px',
        paddingRight: '14px',
        height: '42px',
        borderRadius: '10px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        fontFamily: "'Inter', sans-serif",
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        color: '#0f172a',
        background: '#fff',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
      }}
      onFocus={e => {
        e.target.style.borderColor = '#1e40af';
        e.target.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.1)';
      }}
      onBlur={e => {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }}
    />
  </div>
);
