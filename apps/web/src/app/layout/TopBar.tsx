import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Search, LogOut } from "lucide-react";
import { authApi } from "../../features/auth/api/auth.api";
import { useAuthStore } from "../../features/auth/store";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";

export function TopBar() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const logoutMutation = useMutation({ mutationFn: authApi.logout, onSettled: () => clearSession() });

  return (
    <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-4 px-4 py-3 md:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-lg">🐾</span>
          <span className="hidden font-display text-lg font-semibold text-brand-900 sm:inline">PetCare</span>
        </Link>

        <div className="hidden flex-1 items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm text-brand-700/60 sm:flex">
          <Search size={16} />
          <span>Tìm lịch hẹn, hồ sơ pet hoặc bác sĩ...</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
            <span className="hidden md:inline">{user?.name}</span>
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            aria-label="Đăng xuất"
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-700/70 hover:bg-brand-50 hover:text-brand-800"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
