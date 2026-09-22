import { Outlet } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../features/auth/api/auth.api";
import { useAuthStore } from "../../features/auth/store";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const logoutMutation = useMutation({ mutationFn: authApi.logout, onSettled: () => clearSession() });

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-brand-900">🐾 PetCare</span>
          <div className="flex items-center gap-3 text-sm">
            <NotificationBell />
            <span className="text-brand-700/80">{user?.name}</span>
            <button
              onClick={() => logoutMutation.mutate()}
              className="font-semibold text-brand-700 hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
