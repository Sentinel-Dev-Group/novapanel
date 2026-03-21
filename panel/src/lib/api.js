// ============================================================
//  api.js — Axios API client
//  All requests to the API go through this file.
//  Handles auth headers and token refresh automatically.
// ============================================================

import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ───────────────────────────────────────
//  Automatically attach the access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────
//  If a request fails with 401, try to refresh the token
//  and retry the original request automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    //  If 401 and we haven't already retried
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");

        //  Ask the API for a new access token
        const { data } = await axios.post("/api/auth/refresh", {
          refreshToken,
        });

        //  Save the new tokens
        useAuthStore.getState().setTokens(
          data.accessToken,
          data.refreshToken
        );

        //  Retry the original request with new token
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);

      } catch (refreshError) {
        //  Refresh failed — log the user out
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;