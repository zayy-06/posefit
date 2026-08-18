import axios from "axios";
import { getToken } from "./local-storage";
import { getAdminToken } from "./admin-auth";
import { getProToken } from "./professional-auth";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

httpClient.interceptors.request.use(
  (config) => {
    // Priority: Professional token -> Admin token -> User token
    const token = getProToken() || getAdminToken() || getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);