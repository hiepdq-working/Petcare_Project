import axios from "axios";
import type { ApiResponse } from "@petcare/types";
import { getAccessToken, notifyAuthFailure, setAccessToken } from "./token-store";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL,
  // Required so the httpOnly refresh-token cookie is sent/received — see
  // apps/api auth.cookie.ts for why the refresh token isn't a JWT.
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post<ApiResponse<{ accessToken: string }>>(
      `${baseURL}/auth/refresh`,
      undefined,
      { withCredentials: true },
    );
    if (!response.data.success) return null;
    const token = response.data.data.accessToken;
    setAccessToken(token);
    return token;
  } catch {
    return null;
  }
}

// A 401 means the access token expired (15 min) — transparently swap in a
// fresh one via the refresh cookie and retry, exactly once, before giving
// up and telling the auth store the session is really gone.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isRefreshCall = typeof original?.url === "string" && original.url.includes("/auth/refresh");

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      setAccessToken(null);
      notifyAuthFailure();
    }

    return Promise.reject(error);
  },
);

export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
  return response.data.data;
}

// For endpoints whose payload IS the human-readable message (e.g.
// register's "check your email"), where `data` itself is null.
export function unwrapMessage(response: { data: ApiResponse<unknown> }): string {
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
  return response.data.message;
}

// Every failure path (validation 400, business-rule 4xx, 500) already
// carries a Vietnamese `message` from the API's envelope — surface that
// instead of Axios's generic "Request failed with status code 400".
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const message = error.response?.data?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return "Đã có lỗi xảy ra, vui lòng thử lại sau";
}
