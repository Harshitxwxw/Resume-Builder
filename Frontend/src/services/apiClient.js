import axios from 'axios';

// Get backend URL from environment or default to Render deployment
export const BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  'https://resume-builder-wwhs.onrender.com'
).replace(/\/+$/, '');

export const API_BASE_URL = BACKEND_URL.endsWith('/api')
  ? BACKEND_URL
  : `${BACKEND_URL}/api`;

/**
 * Creates an Axios instance pre-configured with the backend URL,
 * withCredentials enabled (for session cookies), and request interceptor
 * to attach auth token if stored.
 */
export const createApiClient = (subpath = '') => {
  const cleanSubpath = subpath
    ? subpath.startsWith('/')
      ? subpath
      : `/${subpath}`
    : '';

  const client = axios.create({
    baseURL: `${API_BASE_URL}${cleanSubpath}`,
    withCredentials: true
  });

  client.interceptors.request.use(
    (config) => {
      try {
        const token = localStorage.getItem('career_ai_auth_token');
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        // Ignore localStorage access issues
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

export default createApiClient();

