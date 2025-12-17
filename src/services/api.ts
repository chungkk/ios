import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, saveToken, removeToken } from './storage.service';

// Get API base URL from environment
const API_BASE_URL = process.env.API_BASE_URL || 'https://your-backend-domain.com';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject JWT token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API] Error getting token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        const token = await getToken();
        if (token) {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (refreshResponse.data.token) {
            // Save new token
            await saveToken(refreshResponse.data.token);
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
            }
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear token and redirect to login
        console.error('[API] Token refresh failed:', refreshError);
        await removeToken();
        // TODO: Navigate to login screen (will be implemented in Phase 5 with navigation)
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('[API] Network error - check internet connection');
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout');
    }

    return Promise.reject(error);
  }
);

// Export configured API instance
export default api;

// Export types for use in services
export type { AxiosError, AxiosResponse } from 'axios';
