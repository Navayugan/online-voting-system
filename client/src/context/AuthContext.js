/**
 * context/AuthContext.js
 * Global auth context - stores JWT token + user info for both ADMIN and EMPLOYEE
 */
import React, { createContext, useState, useContext, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem('ovms_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((data) => {
    localStorage.setItem('ovms_auth', JSON.stringify(data));
    setAuth(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ovms_auth');
    setAuth(null);
    document.title = 'Online Voting System';
  }, []);

  const isAdmin = auth?.role === 'ADMIN';
  const isEmployee = auth?.role === 'EMPLOYEE';

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
