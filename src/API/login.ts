import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const API_URL = `${API_BASE_URL}/auth`;

export interface User {
  id: number;
  user: string;
  role: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Attempting login with:', { username });

    const response = await axios.post(`${API_URL}/login`, {
      email: username,
      password,
    }, {
      validateStatus: (status) => status < 500
    });

    console.log('Login response:', response.data);

    if (response.status === 401) {
      throw new Error('Invalid username or password');
    }

    if (!response.data || !response.data.user || !response.data.access_token) {
      throw new Error('Invalid response from server');
    }

    // Store token and user data in localStorage
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('userRole', String(response.data.user.role));
    localStorage.setItem('user_id', String(response.data.user.id));
    localStorage.setItem('userEmail', String(response.data.user.user));
    console.log('User logged in successfully:', response.data.user);

    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Login failed';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message ?? error.message ?? errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Login error:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const register = async (username: string, password: string, role = 'user'): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      email: username,
      password,
      role,
    });

    // Auto-login after registration
    if (response.data.user && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userRole', String(response.data.user.role));
      localStorage.setItem('user_id', String(response.data.user.id));
      localStorage.setItem('userEmail', String(response.data.user.user));
    }

    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Registration failed';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message ?? error.message ?? errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Registration error:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const logout = (): void => {
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user ? user.role === 'admin' : false;
};

export const verifyToken = async (): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  try {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch {
    throw new Error('Invalid token');
  }
};

export const isTokenValidLocal = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr) as { exp?: number };
    if (!payload.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
};
