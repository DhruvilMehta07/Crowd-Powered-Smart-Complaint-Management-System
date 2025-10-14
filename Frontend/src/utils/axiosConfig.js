import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:7000',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Utility function to get CSRF token from cookies
const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Request interceptor to automatically add CSRF token
api.interceptors.request.use(
  (config) => {
    // Only add CSRF token for mutating requests (POST, PUT, PATCH, DELETE)
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      const csrfToken = getCookie('csrftoken');
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.detail?.includes('CSRF')) {
      console.error('CSRF token error - please refresh the page');
    }
    return Promise.reject(error);
  }
);

export default api;