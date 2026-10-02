import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, AuthResponseData } from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_STORAGE_KEY = "intake_access_token";

// In-memory token store initialized from localStorage if available
let currentAccessToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

export const getAccessToken = (): string | null => currentAccessToken;

export const setAccessToken = (token: string | null): void => {
  currentAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
};

/**
 * Primary Axios instance configured for INTAKE REST API.
 * withCredentials: true ensures HTTP-only refresh token cookies are transmitted across requests.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Flag and queue to manage concurrent requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// ----------------------------------------------------------------------
// Request Interceptor: Attach Bearer Access Token
// ----------------------------------------------------------------------
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Endpoints that should not have Authorization header attached
    const isAuthBypass =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/refresh-token");

    if (!isAuthBypass && currentAccessToken) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ----------------------------------------------------------------------
// Response Interceptor: Automatic Refresh Token Rotation & Request Retry
// ----------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If no config or network error without response, reject immediately
    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const requestUrl = originalRequest.url || "";

    // Skip retry logic for login/register failures or if refresh itself failed
    const isLoginOrRegister =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");
    const isRefreshRequest = requestUrl.includes("/auth/refresh-token");

    if (status === 401 && !originalRequest._retry && !isLoginOrRegister && !isRefreshRequest) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another refresh is in-flight: queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      isRefreshing = true;

      try {
        // Send request to refresh endpoint. Browser transmits HTTP-only 'refreshToken' cookie.
        const response = await api.post<ApiResponse<AuthResponseData>>("/auth/refresh-token");
        const newAccessToken = response.data.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh endpoint");
        }

        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        // Retry original request with newly acquired access token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);
        setAccessToken(null);

        // Notify application listeners (e.g. AuthContext) that user session has terminated
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("intake:auth:unauthorized"));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
