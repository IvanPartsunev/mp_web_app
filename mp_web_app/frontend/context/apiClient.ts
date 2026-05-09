// apiClient.ts
import axios, {AxiosError, AxiosInstance, InternalAxiosRequestConfig} from "axios";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";

// Event to notify when token is cleared
export const tokenClearedEvent = new Event("token-cleared");

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send refresh cookie to backend
});

// Admin API client — identical to apiClient but sends X-Admin-Request: true
// so the backend CacheControlMiddleware responds with Cache-Control: no-store,
// bypassing the browser HTTP cache and ensuring admin mutations are always visible immediately.
export const adminApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "X-Admin-Request": "true",
  },
});

// Shared request interceptor: inject auth token
function attachRequestInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      // Always send token (even if expired) so backend returns 401
      // This triggers the response interceptor to refresh the token
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Shared response interceptor: handle 401 and token refresh
function attachResponseInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config;

      // Only handle 401 once per request and skip refresh endpoint itself
      if (
        error.response?.status === 401 &&
        original &&
        !(original as any)._retry &&
        !original.url?.includes("/auth/refresh")
      ) {
        (original as any)._retry = true;
        (error as any).isAuthRefresh = true; // Mark as auto-handled auth error

        // If already refreshing, wait for that refresh to complete
        if (isRefreshing && refreshPromise) {
          try {
            const newToken = await refreshPromise;
            if (newToken) {
              original.headers = original.headers || {};
              (original.headers as any).Authorization = `Bearer ${newToken}`;
              return instance(original);
            }
          } catch {
            setAccessToken(null);
            (error as any).isAuthRefresh = true;
            return Promise.reject(error);
          }
        }

        // Start a new refresh
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = (async () => {
            try {
              const res = await axios.post(`${API_BASE_URL}auth/refresh`, {}, {withCredentials: true});
              const newToken = res.data?.access_token;
              if (newToken) {
                setAccessToken(newToken);
                // Dispatch event to invalidate cached queries
                window.dispatchEvent(new Event("token-refreshed"));
                return newToken;
              }
              return null;
            } catch (e) {
              // Silently handle refresh failures
              setAccessToken(null);
              window.dispatchEvent(tokenClearedEvent);
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
              return instance(original);
            }
          } catch {
            setAccessToken(null);
            window.dispatchEvent(tokenClearedEvent);
          }
        }
      }

      return Promise.reject(error);
    }
  );
}

attachRequestInterceptor(apiClient);
attachResponseInterceptor(apiClient);

attachRequestInterceptor(adminApiClient);
attachResponseInterceptor(adminApiClient);

export default apiClient;
