import { create } from "zustand";
import type { AuthUser } from "@petcare/types";
import { setAccessToken, setCachedUser, setRefreshToken } from "../../shared/api/token-store";
import { connectSocket, disconnectSocket } from "../../shared/realtime/socket";

interface AuthState {
  user: AuthUser | null;
  // "checking" while the stored refresh token is being exchanged on launch.
  status: "checking" | "authenticated" | "guest";
  setSession: (user: AuthUser, accessToken: string, refreshToken?: string) => Promise<void>;
  // Offline launch: keep the cached user signed in; a token is fetched on the
  // first request once the connection is back (the 401 interceptor refreshes).
  resumeOffline: (user: AuthUser) => void;
  clearSession: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "checking",
  setSession: async (user, accessToken, refreshToken) => {
    setAccessToken(accessToken);
    if (refreshToken) await setRefreshToken(refreshToken);
    await setCachedUser(JSON.stringify(user));
    set({ user, status: "authenticated" });
    connectSocket();
  },
  resumeOffline: (user) => {
    set({ user, status: "authenticated" });
    connectSocket();
  },
  clearSession: async () => {
    setAccessToken(null);
    await setRefreshToken(null);
    await setCachedUser(null);
    set({ user: null, status: "guest" });
    disconnectSocket();
  },
  updateUser: (user) => set({ user }),
}));
