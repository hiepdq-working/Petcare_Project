import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerAuthFailureHandler } from "../shared/api/token-store";
import { authApi } from "../features/auth/api/auth.api";
import { useAuthStore } from "../features/auth/store";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    registerAuthFailureHandler(clearSession);

    // On boot there's no access token in memory yet — try the httpOnly
    // refresh cookie once to silently restore the session (see
    // features/auth/store.ts on why the token isn't persisted directly).
    authApi
      .refresh()
      .then((session) => setSession(session.user, session.accessToken))
      .catch(() => clearSession());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
