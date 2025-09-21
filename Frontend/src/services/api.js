import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true, // needed if backend uses session cookies
});

// Attach token if backend uses JWT
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const loginUser = (credentials) => API.post("/users/login/", credentials);
export const logoutUser = () => API.post("/users/logout/");
export const signupCitizen = (data) => API.post("/users/signup/citizen/", data);
export const signupAuthority = (data) => API.post("/users/signup/authority/", data);
export const signupFieldWorker = (data) => API.post("/users/signup/fieldworker/", data);
