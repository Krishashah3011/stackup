import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stackup_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('stackup_token');
      localStorage.removeItem('stackup_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ─── Applications ─────────────────────────────────────────────────────────────
export const applicationService = {
  getAll: (params) => api.get('/applications', { params }),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

// ─── DSA ──────────────────────────────────────────────────────────────────────
export const dsaService = {
  getAll: () => api.get('/dsa'),
  create: (data) => api.post('/dsa', data),
  update: (id, data) => api.put(`/dsa/${id}`, data),
  delete: (id) => api.delete(`/dsa/${id}`),
};

// ─── Aptitude ─────────────────────────────────────────────────────────────────
export const aptitudeService = {
  getAll: () => api.get('/aptitude'),
  create: (data) => api.post('/aptitude', data),
  update: (id, data) => api.put(`/aptitude/${id}`, data),
  delete: (id) => api.delete(`/aptitude/${id}`),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiService = {
  analyzeResume: (formData) =>
    api.post('/ai/resume-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  generateInterview: (data) => api.post('/ai/interview', data),
};

export default api;
