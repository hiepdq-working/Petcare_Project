import { create } from "zustand";
import type { AuthUser } from "@petcare/types";
import { setAccessToken, setRefreshToken } from "../../shared/api/token-store";

interface AuthState {
  user: AuthUser | null;
  // "checking" while the stored refresh token is being exchanged on launch.
  status: "checking" | "authenticated" | "guest";
  setSession: (user: AuthUser, accessToken: string, refreshToken?: string) => Promise<void>;
  clearSession: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "checking",
  setSession: async (user, accessToken, refreshToken) => {
    setAccessToken(accessToken);
    if (refreshToken) await setRefreshToken(refreshToken);
    set({ user, status: "authenticated" });
  },
  clearSession: async () => {
    setAccessToken(null);
    await setRefreshToken(null);
    set({ user: null, status: "guest" });
  },
  updateUser: (user) => set({ user }),
}));
