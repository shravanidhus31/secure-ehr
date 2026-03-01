import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const recordsAPI = {
  list: () => api.get('/records/'),
  get: (id) => api.get(`/records/${id}`),
  create: (data) => api.post('/records/', data),
};

export const accessAPI = {
  list: (recordId) => api.get(`/records/${recordId}/access`),
  grant: (recordId, data) => api.post(`/records/${recordId}/access`, data),
  revoke: (recordId, userId) => api.delete(`/records/${recordId}/access/${userId}`),
};

export const usersAPI = {
  searchDoctors: (q) => api.get(`/users/doctors?q=${q}`),
  me: () => api.get('/users/me'),
  getPublic: (userId) => api.get(`/users/${userId}/public`)
};

export const auditAPI = {
  mine: () => api.get('/audit/me'),
  record: (id) => api.get(`/audit/record/${id}`),
};

export default api;