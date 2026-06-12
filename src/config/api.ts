import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { API_BASE_URL } from '../API/baseUrl';

// Create a custom axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  withCredentials: true, // Important for sending cookies with CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Skip adding auth header if X-Skip-Interceptor is set
    if (config.headers && config.headers['X-Skip-Interceptor']) {
      return config;
    }

    // Get token from localStorage or your auth store
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      // Use type assertion to handle headers properly
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Skip handling if it's a login request to prevent loops
    if (error.config?.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: Please check your internet connection');
      return Promise.reject(new Error('Network Error: Please check your internet connection'));
    }

    // Handle common errors (401, 403, 500, etc.)
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Only redirect if not already on the login page
          if (!window.location.pathname.includes('/admin/login')) {
            // Clear any existing auth data
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            // Use window.location.replace to prevent adding to browser history
            window.location.replace('/admin/login');
          }
          break;
        case 403:
          console.error('Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          console.error('Not Found: The requested resource was not found');
          break;
        case 500:
          console.error('Server Error: Something went wrong on the server');
          break;
        default:
          console.error(`Error: ${error.message}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error: Please check your internet connection');
    } else {
      // Something happened in setting up the request
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API methods
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.get<T>(url, config);
  return response.data;
};

export const post = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.post<T>(url, data, config);
  return response.data;
};

export const put = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.put<T>(url, data, config);
  return response.data;
};

export const del = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.delete<T>(url, config);
  return response.data;
};

export default api;
