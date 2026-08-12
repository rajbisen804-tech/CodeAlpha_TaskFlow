import axios from 'axios';

const api = axios.create({
  baseURL: 'https://codealpha-taskflow-56gq.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we're already on login/register
      const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register') || window.location.pathname === '/';
      if (!isAuthPage) {
        localStorage.removeItem('taskflow_token');
        localStorage.removeItem('taskflow_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
