/**
 * api/axios.js
 * Axios instance that automatically attaches JWT token
 */
import axios from 'axios';
import { API_BASE } from './config';

const api = axios.create({ baseURL: API_BASE });

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('ovms_auth');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Handle 401/403 globally
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    if (status === 401) {
      // Token expired or invalid - clear storage and redirect to portal
      const wasAdmin = window.location.pathname.startsWith('/admin') ||
        (() => {
          try {
            const stored = localStorage.getItem('ovms_auth');
            return stored ? JSON.parse(stored).user?.role === 'ADMIN' : false;
          } catch { return false; }
        })();

      localStorage.removeItem('ovms_auth');
      window.location.href = wasAdmin ? '/admin-login' : '/login';
    }
    // Note: 403 Forbidden is treated as an authorized action denial, NOT a session logout
    return Promise.reject(err);
  }
);

export default api;
