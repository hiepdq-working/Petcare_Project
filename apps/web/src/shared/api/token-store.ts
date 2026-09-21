// Access token lives here in memory (module scope), not localStorage, so
// it can't be read by an XSS payload. It's the single source the axios
// interceptor reads/writes; the auth feature's Zustand store updates it
// whenever a session starts/ends. See features/auth/store.ts.
let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Lets a feature (auth) react to "the refresh cookie is gone too, you're
// logged out" without shared/api depending on the feature's store.
export function registerAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}

export function notifyAuthFailure(): void {
  onAuthFailure?.();
}
