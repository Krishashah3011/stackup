import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stackup_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('stackup_token');
      if (token) {
        localStorage.removeItem('stackup_token');
        localStorage.removeItem('stackup_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  getProfile:    ()     => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  deleteAccount: (data) => api.delete('/auth/profile', { data }),
};

export const applicationService = {
  getStats: ()           => api.get('/applications/stats'),
  getAll:   (params)     => api.get('/applications', { params }),
  getOne:   (id)         => api.get(`/applications/${id}`),
  create:   (data)       => api.post('/applications', data),
  update:   (id, data)   => api.put(`/applications/${id}`, data),
  delete:   (id)         => api.delete(`/applications/${id}`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

export const dsaService = {
  getSummary:  ()           => api.get('/dsa/summary'),
  getAll:      ()           => api.get('/dsa'),
  create:      (data)       => api.post('/dsa', data),
  bulkCreate:  (topics)     => api.post('/dsa/bulk', { topics }),
  update:      (id, data)   => api.put(`/dsa/${id}`, data),
  increment:   (id)         => api.patch(`/dsa/${id}/increment`),
  delete:      (id)         => api.delete(`/dsa/${id}`),
  getPracticeState: () => api.get('/dsa/practice/state'),
  updatePracticeState: (data) => api.put('/dsa/practice/state', data),
  getPracticeQuestions: (topic) => api.get('/dsa/practice/questions', { params: { topic } }),
  getQuestionDetails: (questionId) => api.get(`/dsa/practice/questions/${questionId}`),
  submitPracticeCode: (data) => api.post('/dsa/practice/submit', data),
};

export const aptitudeService = {
  getSummary:  ()              => api.get('/aptitude/summary'),
  getAll:      ()              => api.get('/aptitude'),
  create:      (data)          => api.post('/aptitude', data),
  bulkCreate:  (categories)    => api.post('/aptitude/bulk', { categories }),
  update:      (id, data)      => api.put(`/aptitude/${id}`, data),
  logSession:  (id, data)      => api.patch(`/aptitude/${id}/session`, data),
  delete:      (id)            => api.delete(`/aptitude/${id}`),
};

export const aiService = {
  analyzeResume:      (formData)  =>
    api.post('/ai/resume-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  getResumeHistory:   ()          => api.get('/ai/resume/history'),
  generateInterview:      (data)  => api.post('/ai/interview', data),
  getInterviewHistory:    (params)=> api.get('/ai/interview/history', { params }),
  getInterviewSession:    (id)    => api.get(`/ai/interview/${id}`),
  deleteInterviewSession: (id)    => api.delete(`/ai/interview/${id}`),
};

export default api;