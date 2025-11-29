import axios from "axios";
import { getAccessToken, setAccessToken, getCsrfToken } from "../utils/auth";

// Production Railway backend URL
const API_BASE_URL = "https://crowd-powered-smart-complaint-management-system-production-8c6d.up.railway.app/";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
});


API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      const csrfToken = getCsrfToken();
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

// Response interceptor: Auto-refresh token on expiry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token is expired, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint (reads refresh token from HttpOnly cookie)
        const response = await axios.post(
          `${API_BASE_URL}/users/token/refresh/`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.access;
        setAccessToken(newAccessToken);
        
        // Update Authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const loginUser = (credentials) => API.post("/users/login/", credentials);
export const logoutUser = () => API.post("/users/logout/");
export const signupCitizen = (data) => API.post("/users/signup/citizen/", data);
export const signupAuthority = (data) => API.post("/users/signup/authority/", data);
export const signupFieldWorker = (data) => API.post("/users/signup/fieldworker/", data);
