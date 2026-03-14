import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenManager } from "@securevault/libs";
import { AUTH_ENDPOINT } from "@securevault/constants";

const url = process.env.EXPO_PUBLIC_API_URL;

const isDev = process.env.NODE_ENV === "development";

const baseURL = isDev ? url : url?.replace("http://", "https://");

if (
  baseURL &&
  !baseURL.startsWith("https://") &&
  process.env.NODE_ENV === "production"
) {
  throw new Error("Security Error: Insecure API URL provided in production.");
}
const axiosInstance = axios.create({ baseURL });
/* -------------------------------------------------- */
/* State Management */
/* -------------------------------------------------- */

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  pendingQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  pendingQueue = [];
};

const shouldSkipRefresh = (url?: string) => {
  if (!url) return true;
  const skipUrls = [
    AUTH_ENDPOINT.POST_PASSWORD_LOGIN,
    AUTH_ENDPOINT.POST_PASSWORD_REGISTER,
    AUTH_ENDPOINT.POST_REFRESH,
  ];
  return skipUrls.some((path) => url.includes(path));
};

const handleUnauthorizedExit = async () => {
  await tokenManager.removeAllTokens();
};

/* -------------------------------------------------- */
/* Interceptors */
/* -------------------------------------------------- */

axiosInstance.interceptors.request.use(async (config) => {
  const token = await tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    // 1. If not a 401 or shouldn't refresh, just fail
    if (
      !error.response ||
      error.response.status !== 401 ||
      !originalRequest ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // 2. If this is a SECOND 401 for the same request, refresh failed or token is still bad
    if (originalRequest._retry) {
      await handleUnauthorizedExit();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    // 3. Handle concurrent requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          },
          reject: (err) => reject(err),
        });
      });
    }

    /* ---------- Start Refresh ---------- */
    isRefreshing = true;

    try {
      const refreshToken = await tokenManager.getRefreshToken();

      // Use standard axios instance for the refresh call
      const url = `${process.env.EXPO_PUBLIC_API_URL}${AUTH_ENDPOINT.POST_REFRESH}`;
      const res = await axios.post(url, { refreshToken });

      const payload: any = res.data;
      const access_token = payload?.data?.accessToken;
      const new_refresh_token = payload?.data?.refreshToken;

      if (!access_token) {
        throw new Error("Invalid refresh response");
      }

      await tokenManager.setBothTokens(access_token, new_refresh_token);
      // Successfully refreshed!
      processQueue(null, access_token);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      await handleUnauthorizedExit();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
