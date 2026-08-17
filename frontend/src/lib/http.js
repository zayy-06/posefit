import axios from "axios";
import { getToken } from "./local-storage";
import { getAdminToken } from "./admin-auth";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

httpClient.interceptors.request.use(
  (config) => {
    // Prefer admin token, fall back to regular user token
    const token = getAdminToken() || getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);