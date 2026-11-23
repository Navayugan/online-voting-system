/**
 * components/ui/FormFields.jsx
 */
import React from 'react';

export const Input = ({ label, required, error, id, containerStyle, ...props }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
  const { marginBottom, marginTop, marginLeft, marginRight, margin, flex, width, minWidth, maxWidth, alignSelf, ...inputStyle } = props.style || {};

  const resolvedContainerStyle = {
    marginBottom: containerStyle?.marginBottom ?? (marginBottom !== undefined ? marginBottom : (label ? '18px' : '0')),
    marginTop: containerStyle?.marginTop ?? marginTop,
    marginLeft: containerStyle?.marginLeft ?? marginLeft,
    marginRight: containerStyle?.marginRight ?? marginRight,
    margin: containerStyle?.margin ?? margin,
    flex: containerStyle?.flex ?? flex,
    width: containerStyle?.width ?? width ?? (flex ? undefined : '100%'),
    minWidth: containerStyle?.minWidth ?? minWidth,
    maxWidth: containerStyle?.maxWidth ?? maxWidth,
    alignSelf: containerStyle?.alignSelf ?? alignSelf,
    boxSizing: 'border-box',
    ...containerStyle,
  };

  return (
    <div style={resolvedContainerStyle}>
      {label && (
        <label htmlFor={inputId} style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
          {label}{required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        style={{
          width: '100%',
          height: '42px',
          padding: '10px 14px',
          borderRadius: '10px',
          border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          color: '#0f172a',
          background: props.disabled ? '#f1f5f9' : '#fff',
          cursor: props.disabled ? 'not-allowed' : 'text',
          ...inputStyle
        }}
        onFocus={e => {
          e.target.style.borderColor = '#1e40af';
          e.target.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.1)';
          props.onFocus?.(e);
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
};

export const Select = ({ label, required, error, id, children, containerStyle, disabled, ...props }) => {
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
  const { marginBottom, marginTop, marginLeft, marginRight, margin, flex, width, minWidth, maxWidth, alignSelf, ...selectStyle } = props.style || {};

  const resolvedContainerStyle = {
    marginBottom: containerStyle?.marginBottom ?? (marginBottom !== undefined ? marginBottom : (label ? '18px' : '0')),
    marginTop: containerStyle?.marginTop ?? marginTop,
    marginLeft: containerStyle?.marginLeft ?? marginLeft,
    marginRight: containerStyle?.marginRight ?? marginRight,
    margin: containerStyle?.margin ?? margin,
    flex: containerStyle?.flex ?? flex,
    width: containerStyle?.width ?? width ?? (flex ? undefined : '100%'),
    minWidth: containerStyle?.minWidth ?? minWidth,
    maxWidth: containerStyle?.maxWidth ?? maxWidth,
    alignSelf: containerStyle?.alignSelf ?? alignSelf,
    boxSizing: 'border-box',
    ...containerStyle,
  };

  return (
    <div style={resolvedContainerStyle}>
      {label ? (
        <label htmlFor={selectId} style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
          {label}{required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
        </label>
      ) : null}
      <select
        id={selectId}
        disabled={disabled}
        {...props}
        style={{
          width: '100%',
          height: '42px',
          padding: '9px 38px 9px 14px',
          borderRadius: '10px',
          border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          outline: 'none',
          boxSizing: 'border-box',
          background: disabled ? '#f1f5f9' : '#fff',
          color: disabled ? '#94a3b8' : '#0f172a',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
          ...selectStyle
        }}
        onFocus={e => {
          e.target.style.borderColor = '#1e40af';
          e.target.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.12)';
          props.onFocus?.(e);
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      >
        {children}
      </select>
      {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
};

export const Textarea = ({ label, required, error, id, containerStyle, ...props }) => {
  const areaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
  const { marginBottom, marginTop, marginLeft, marginRight, margin, flex, width, minWidth, maxWidth, alignSelf, ...areaStyle } = props.style || {};

  const resolvedContainerStyle = {
    marginBottom: containerStyle?.marginBottom ?? (marginBottom !== undefined ? marginBottom : (label ? '18px' : '0')),
    marginTop: containerStyle?.marginTop ?? marginTop,
    marginLeft: containerStyle?.marginLeft ?? marginLeft,
    marginRight: containerStyle?.marginRight ?? marginRight,
    margin: containerStyle?.margin ?? margin,
    flex: containerStyle?.flex ?? flex,
    width: containerStyle?.width ?? width ?? (flex ? undefined : '100%'),
    minWidth: containerStyle?.minWidth ?? minWidth,
    maxWidth: containerStyle?.maxWidth ?? maxWidth,
    alignSelf: containerStyle?.alignSelf ?? alignSelf,
    boxSizing: 'border-box',
    ...containerStyle,
  };

  return (
    <div style={resolvedContainerStyle}>
      {label && (
        <label htmlFor={areaId} style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
          {label}{required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <textarea
        id={areaId}
        {...props}
        rows={4}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '10px',
          border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          outline: 'none',
          boxSizing: 'border-box',
          resize: 'vertical',
          color: '#0f172a',
          background: props.disabled ? '#f1f5f9' : '#fff',
          cursor: props.disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          ...areaStyle
        }}
        onFocus={e => {
          e.target.style.borderColor = '#1e40af';
          e.target.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.1)';
          props.onFocus?.(e);
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
};
