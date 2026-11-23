/**
 * components/ui/DataTable.jsx
 */
import React from 'react';

export const DataTable = ({ columns, rows, onRow, emptyState }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
          {columns.map(col => (
            <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>{emptyState || 'No records found.'}</td></tr>
        )}
        {rows.map((row, i) => (
          <tr key={i} onClick={() => onRow && onRow(row)}
            style={{ borderBottom: '1px solid #f8fafc', cursor: onRow ? 'pointer' : 'default', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {columns.map(col => (
              <td key={col.key} style={{ padding: '14px 16px', color: col.color || '#374151', whiteSpace: col.nowrap ? 'nowrap' : 'normal', ...col.cellStyle }}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
