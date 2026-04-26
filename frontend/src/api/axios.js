/**
 * api/axios.js – Configured Axios instance with JWT interceptor
 */
import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parky_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle global 401 – redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('parky_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
