import axios from 'axios';
import { getCsrfToken } from './auth';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000',
  withCredentials: true,
});



// Request interceptor to automatically add CSRF token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if(token)
    {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // add CSRF token for unsafe methods
    const method = (config.method || '').toUpperCase();
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!safeMethods.includes(method)) {
      const csrf = getCsrfToken();
      if (csrf) config.headers['X-CSRFToken'] = csrf;
    }
    return config;
  },
  (error)=>{
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) =>
  {
    const originalRequest = error.config;
    if (originalRequest?.skipAuthRefresh) {
      // Some endpoints (like login) should surface 401s directly to the caller
      return Promise.reject(error);
    }
    if(error.response?.status === 401 && !originalRequest._retry)
    {
      originalRequest._retry = true;

      try
      {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000'}/users/token/refresh`,
          {},
          {withCredentials: true}

        );
        if(refreshResponse.status===200)
        {
          const newAccessToken = refreshResponse.data.access;
          localStorage.setItem('access_token',newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      }
      catch(refreshError)
      {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;