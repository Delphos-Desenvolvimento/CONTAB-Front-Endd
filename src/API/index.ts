import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 20000,
});

// Adiciona um interceptador para incluir o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const path = (config.url || '').toString();
    const method = (config.method || 'get').toLowerCase();
    // Precisely mark only truly public endpoints
    const publicGetExact = new Set([
      '/content/about',
      '/content/statistics',
      '/content/solutions',
      '/links',
    ]);
    const isTeamPublic = path === '/team' && method === 'get';
    const isPartnersPublic = path === '/partners' && method === 'get';
    const isNewsPublic = path.startsWith('/news') && method === 'get';
    const isStatsPublic = path.startsWith('/stats') && method === 'get';
    const isPublicGetExact = method === 'get' && publicGetExact.has(path);
    const isPublic = isTeamPublic || isPartnersPublic || isNewsPublic || isStatsPublic || isPublicGetExact;
    if (token && !isPublic) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add session ID for view tracking
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    config.headers['x-session-id'] = sessionId;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de resposta para capturar token expirado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const cfg = error.config || {};
    const shouldRetry = !cfg.__isRetry && (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.name === 'AxiosError');
    if (shouldRetry) {
      cfg.__isRetry = true;
      const delay = 800 + Math.floor(Math.random() * 400);
      return new Promise((resolve) => setTimeout(resolve, delay)).then(() => api.request(cfg));
    }
    if (error.response && error.response.status === 401) {
      // Limpa token e dados do usuário
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user_id');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      // Redireciona para a página de login (rota existente)
      const loginPath = '/admin/login?expired=1';
      if (window.location.pathname !== '/admin/login') {
        window.location.replace(loginPath);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export const apiPublic = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiPublic.interceptors.request.use((config) => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  config.headers = config.headers || {};
  config.headers['x-session-id'] = sessionId;
  return config;
});

apiPublic.interceptors.response.use(
  (response) => response,
  (error) => {
    const cfg = error.config || {};
    const shouldRetry = !cfg.__isRetry && (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.name === 'AxiosError');
    if (shouldRetry) {
      cfg.__isRetry = true;
      const delay = 800 + Math.floor(Math.random() * 400);
      return new Promise((resolve) => setTimeout(resolve, delay)).then(() => apiPublic.request(cfg));
    }
    return Promise.reject(error);
  }
);
