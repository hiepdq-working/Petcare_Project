import { create } from "zustand";
import type { AuthUser } from "@petcare/types";
import { setAccessToken } from "../../shared/api/token-store";
import { connectSocket, disconnectSocket } from "../../shared/realtime/socket";

interface AuthState {
  user: AuthUser | null;
  // Distinguishes "still checking the refresh cookie on boot" from "checked,
  // no session" — without this the UI would flash a login form for a split
  // second before the silent refresh resolves.
  status: "checking" | "authenticated" | "guest";
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "checking",
  setSession: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, status: "authenticated" });
    connectSocket();
  },
  clearSession: () => {
    setAccessToken(null);
    set({ user: null, status: "guest" });
    disconnectSocket();
  },
}));
