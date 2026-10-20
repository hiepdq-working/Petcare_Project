import * as SecureStore from "expo-secure-store";

const REFRESH_KEY = "petcare.refreshToken";

// Access token stays in memory (15 min); the refresh token is the only
// thing persisted, in the platform keystore.
let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(REFRESH_KEY, token);
  else await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export function registerAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}
export const notifyAuthFailure = () => onAuthFailure?.();
