import axios from 'axios';

// Use demo mode for GitHub Pages
const isDemoMode = window.location.hostname === 'deepika-sirivella2904.github.io';

const api = axios.create({
  baseURL: isDemoMode ? 'https://your-backend-url.onrender.com' : '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
