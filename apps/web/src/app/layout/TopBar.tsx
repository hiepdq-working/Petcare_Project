import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Search, LogOut, Home, MapPin, MessageCircle, Settings, Shield } from "lucide-react";
import { UserRole } from "@petcare/types";
import { authApi } from "../../features/auth/api/auth.api";
import { useAuthStore } from "../../features/auth/store";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";

export function TopBar() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const logoutMutation = useMutation({ mutationFn: authApi.logout, onSettled: () => clearSession() });
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const isPetOwner = user?.role === UserRole.PET_OWNER;

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(search ? `/hospitals/nearby?q=${encodeURIComponent(search)}` : "/hospitals/nearby");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-4 px-4 py-3 md:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-lg">🐾</span>
          <span className="hidden font-display text-lg font-semibold text-brand-900 sm:inline">PetCare</span>
        </Link>

        {isPetOwner ? (
          <Link
            to="/feed"
            aria-label="Trang chủ"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-700/70 hover:bg-brand-50 hover:text-brand-800 sm:flex"
          >
            <Home size={18} />
          </Link>
        ) : null}

        {isPetOwner ? (
          <form onSubmit={handleSearchSubmit} className="hidden flex-1 items-center gap-2 sm:flex">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm">
              <Search size={16} className="text-brand-700/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm phòng khám theo tên..."
                className="w-full bg-transparent outline-none placeholder:text-brand-700/50"
              />
            </div>
            <Link
              to="/hospitals/nearby"
              aria-label="Tìm theo bản đồ"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-white text-brand-700/70 hover:bg-brand-50"
            >
              <MapPin size={16} />
            </Link>
          </form>
        ) : (
          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm text-brand-700/60 sm:flex">
            <Search size={16} />
            <span>Tìm lịch hẹn, hồ sơ pet hoặc bác sĩ...</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isPetOwner ? (
            <Link
              to="/messages"
              aria-label="Tin nhắn"
              className="flex h-9 w-9 items-center justify-center rounded-full text-brand-700/70 hover:bg-brand-50 hover:text-brand-800"
            >
              <MessageCircle size={18} />
            </Link>
          ) : null}
          <NotificationBell />

          {isPetOwner ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              </button>
              {menuOpen ? (
                <>
                  <button
                    aria-hidden
                    tabIndex={-1}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5">
                    <p className="truncate px-3 py-2 text-sm font-semibold text-brand-900">{user?.name}</p>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-800 hover:bg-brand-50"
                    >
                      <Settings size={16} /> Cài đặt
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-800 hover:bg-brand-50"
                    >
                      <Shield size={16} /> Quyền riêng tư
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logoutMutation.mutate();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
