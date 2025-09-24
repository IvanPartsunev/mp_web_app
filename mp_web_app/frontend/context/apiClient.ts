// apiClient.ts
import axios, {AxiosError, AxiosInstance, InternalAxiosRequestConfig} from "axios";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";
import {isJwtExpired} from "@/context/jwt";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send refresh cookie to backend
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !isJwtExpired(token)) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  } else if (token) {
    // Try to refresh proactively before sending request
    try {
      const res = await axios.post(
        `${API_BASE_URL}auth/refresh`,
        {},
        {withCredentials: true}
      );
      const newToken = res.data?.access_token;
      if (newToken) {
        setAccessToken(newToken);
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${newToken}`;
      }
    } catch {
      setAccessToken(null);
    }
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    // Only handle 401 once per request
    if (error.response?.status === 401 && original && !(original as any)._retry) {
      (original as any)._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await axios.post(`${API_BASE_URL}auth/refresh`, {}, {withCredentials: true});
          const newToken = (res as any)?.data?.access_token;
          if (newToken) {
            setAccessToken(newToken);
            pendingQueue.forEach((cb) => cb());
            pendingQueue = [];
            // retry original with new token
            original.headers = original.headers || {};
            (original.headers as any).Authorization = `Bearer ${newToken}`;
            return apiClient(original);
          }
        } catch (e) {
          setAccessToken(null);
          pendingQueue = [];
          // fall through to reject
        } finally {
          isRefreshing = false;
        }
      } else {
        // Queue this request until refresh finishes
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        const token = getAccessToken();
        if (token) {
          original.headers = original.headers || {};
          (original.headers as any).Authorization = `Bearer ${token}`;
          return apiClient(original);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;