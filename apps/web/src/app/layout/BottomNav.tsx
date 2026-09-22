import { Link, NavLink } from "react-router-dom";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";

const ITEMS = [
  { to: "/pets", label: "Trang chủ", icon: Home, end: true },
  { to: "/hospitals/nearby", label: "Khám phá", icon: Compass },
  { to: "/messages", label: "Tin nhắn", icon: MessageCircle },
  { to: "/settings", label: "Tài khoản", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-2">
        {ITEMS.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
                isActive ? "text-brand-700" : "text-brand-700/50"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}

        <Link
          to="/feed"
          aria-label="Tạo bài viết mới"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-md"
        >
          <Plus size={22} />
        </Link>

        {ITEMS.slice(2).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
                isActive ? "text-brand-700" : "text-brand-700/50"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
