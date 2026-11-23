/**
 * components/ui/Feedback.jsx
 */
import React from 'react';
import { Btn } from './Button';

export const Spinner = ({ size = 40 }) => (
  <>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{ width: `${size}px`, height: `${size}px`, border: `${size / 10}px solid #e2e8f0`, borderTopColor: '#1e40af', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </>
);

export const LoadingState = ({ message = 'Loading...' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '16px' }}>
    <Spinner />
    <p style={{ color: '#64748b' }}>{message}</p>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div style={{ textAlign: 'center', padding: '80px 24px' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
    <p style={{ color: '#ef4444', marginBottom: '16px' }}>{message}</p>
    {onRetry && <Btn onClick={onRetry}>Retry</Btn>}
  </div>
);

export const EmptyState = ({ icon = '📭', title, desc, action }) => (
  <div style={{ textAlign: 'center', padding: '64px 24px' }}>
    <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>
    <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{desc}</p>
    {action}
  </div>
);
