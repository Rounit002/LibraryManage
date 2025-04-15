import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://librarymanage-sm1b.onrender.com/api'
  : 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true // Keep this for now, though JWT makes it less critical
});

// Store and manage JWT token
let token: string | null = localStorage.getItem('token');

apiClient.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      response.data = transformKeysToCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - Redirecting to login:', error.response?.data?.message);
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const errorData = error.response?.data || { message: error.message };
    return Promise.reject(new Error(errorData.message || 'An unexpected error occurred'));
  }
);

const transformKeysToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysToCamelCase(item));
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      newObj[camelKey] = transformKeysToCamelCase(value);
    }
    return newObj;
  }
  return obj;
};

const api = {
  login: async ({ username, password }: { username: string; password: string }) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { message, token, user } = response.data;
      if (message === 'Login successful' && token && user) {
        console.log('Login successful, user:', user);
        localStorage.setItem('token', token); // Store token
        return user; // Return user object
      } else {
        throw new Error('Login failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Login error details:', error.response?.data || error.message);
      throw error instanceof Error ? error : new Error('Login failed due to server error');
    }
  },

  logout: async () => {
    try {
      const response = await apiClient.get('/auth/logout');
      localStorage.removeItem('token'); // Clear token on logout
      console.log('Logout response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      throw error;
    }
  },

  checkAuthStatus: async () => {
    try {
      const response = await apiClient.get('/auth/status');
      console.log('Auth status check:', response.data);
      return response.data;
    } catch (error) {
      console.error('Auth status check failed:', error.response?.data || error.message);
      throw error;
    }
  },

  // Other methods (unchanged, ensure they use the token via interceptor)
  getStudents: async () => {
    try {
      const response = await apiClient.get('/students');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ... (keep other methods as they are)
};

export default api;