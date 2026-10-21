import axios from "axios";
import type { ApiResponse, AuthResponse } from "@petcare/types";
import { API_URL } from "./config";
import {
  getAccessToken,
  getRefreshToken,
  notifyAuthFailure,
  setAccessToken,
  setRefreshToken,
} from "./token-store";

// `X-Client: mobile` makes the API return/accept the refresh token in the
// body instead of an httpOnly cookie (a native app has no cookie jar).
const MOBILE_HEADERS = { "X-Client": "mobile" };

export const apiClient = axios.create({ baseURL: API_URL, headers: MOBILE_HEADERS });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

// Rotates the refresh token: the server invalidates the old one on every
// use, so the new one MUST be stored before anything else can refresh.
export async function refreshSession(): Promise<AuthResponse | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await axios.post<ApiResponse<AuthResponse>>(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: MOBILE_HEADERS },
    );
    if (!response.data.success) return null;
    const session = response.data.data;
    setAccessToken(session.accessToken);
    if (session.refreshToken) await setRefreshToken(session.refreshToken);
    return session;
  } catch {
    return null;
  }
}

export type RestoreResult =
  | { status: "ok"; session: AuthResponse }
  | { status: "offline" }
  | { status: "invalid" };

// Launch-time variant of refreshSession that tells "the server said no" apart
// from "couldn't reach the server": only the former should sign the user out.
export async function restoreSession(): Promise<RestoreResult> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return { status: "invalid" };
  try {
    const response = await axios.post<ApiResponse<AuthResponse>>(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: MOBILE_HEADERS, timeout: 10_000 },
    );
    if (!response.data.success) return { status: "invalid" };
    const session = response.data.data;
    setAccessToken(session.accessToken);
    if (session.refreshToken) await setRefreshToken(session.refreshToken);
    return { status: "ok", session };
  } catch (error) {
    // No response at all (offline, DNS, timeout) → keep the session.
    return axios.isAxiosError(error) && !error.response ? { status: "offline" } : { status: "invalid" };
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isRefreshCall = typeof original?.url === "string" && original.url.includes("/auth/refresh");

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      refreshPromise ??= refreshSession()
        .then((session) => session?.accessToken ?? null)
        .finally(() => {
          refreshPromise = null;
        });
      const newToken = await refreshPromise;
      if (newToken) {
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
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}

export function unwrapMessage(response: { data: ApiResponse<unknown> }): string {
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.message;
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const message = error.response?.data?.message;
    if (message) return message;
    if (!error.response) return "Không kết nối được máy chủ, vui lòng kiểm tra mạng";
  }
  if (error instanceof Error) return error.message;
  return "Đã có lỗi xảy ra, vui lòng thử lại sau";
}

// RN's FormData takes a { uri, name, type } descriptor in place of a File.
// Server accepts jpeg/png/webp up to 5 MB in the `file` field.
export async function uploadImage(uri: string, mimeType?: string | null): Promise<{ url: string }> {
  const type = mimeType && mimeType.startsWith("image/") ? mimeType : "image/jpeg";
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const formData = new FormData();
  formData.append("file", { uri, name: `photo.${ext}`, type } as unknown as Blob);
  return unwrap(await apiClient.post("/uploads", formData, { headers: { "Content-Type": "multipart/form-data" } }));
}
