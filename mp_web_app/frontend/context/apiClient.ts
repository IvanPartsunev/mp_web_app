// apiClient.ts
import axios, {AxiosError, AxiosInstance, InternalAxiosRequestConfig} from "axios";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";
import {isJwtExpired} from "@/context/jwt";

// Event to notify when user should be logged out
export const authFailedEvent = new Event('auth-failed');

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send refresh cookie to backend
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !isJwtExpired(token)) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  } else if (token && isJwtExpired(token)) {
    // Token is expired, clear it and let the response interceptor handle refresh on 401
    setAccessToken(null);
  }
  return config;
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    
    // Only handle 401 once per request and skip refresh endpoint itself
    if (
      error.response?.status === 401 && 
      original && 
      !(original as any)._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      (original as any)._retry = true;

      // If already refreshing, wait for that refresh to complete
      if (isRefreshing && refreshPromise) {
        try {
          const newToken = await refreshPromise;
          if (newToken) {
            original.headers = original.headers || {};
            (original.headers as any).Authorization = `Bearer ${newToken}`;
            return apiClient(original);
          }
        } catch {
          setAccessToken(null);
          return Promise.reject(error);
        }
      }

      // Start a new refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const res = await axios.post(
              `${API_BASE_URL}auth/refresh`, 
              {}, 
              {withCredentials: true}
            );
            const newToken = res.data?.access_token;
            if (newToken) {
              setAccessToken(newToken);
              return newToken;
            }
            return null;
          } catch (e) {
            // Silently handle refresh failures - don't log to console
            setAccessToken(null);
            return null;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();

        try {
          const newToken = await refreshPromise;
          if (newToken) {
            original.headers = original.headers || {};
            (original.headers as any).Authorization = `Bearer ${newToken}`;
            return apiClient(original);
          } else {
            // Refresh failed, notify app to logout silently
            window.dispatchEvent(authFailedEvent);
          }
        } catch {
          setAccessToken(null);
          window.dispatchEvent(authFailedEvent);
        }
      }
    }
    
    // Suppress console errors for auth refresh failures
    if (error.config?.url?.includes('auth/refresh') && error.response?.status === 401) {
      return Promise.reject(new Error('Authentication expired'));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;