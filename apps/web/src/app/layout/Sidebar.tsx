import { NavLink } from "react-router-dom";
import { UserRole } from "@petcare/types";
import {
  LayoutGrid,
  CalendarDays,
  Stethoscope,
  FolderHeart,
  Settings,
  ClipboardCheck,
  Wrench,
  Rss,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_BY_ROLE: Partial<Record<UserRole, NavItem[]>> = {
  [UserRole.HOSPITAL_OWNER]: [
    { to: "/hospital/profile", label: "Tổng quan", icon: LayoutGrid, end: true },
    { to: "/hospital/appointments", label: "Lịch khám", icon: CalendarDays },
    { to: "/hospital/vets", label: "Bác sĩ", icon: Stethoscope },
    { to: "/hospital/services", label: "Dịch vụ", icon: Wrench },
    { to: "/feed", label: "Bảng tin", icon: Rss },
    { to: "/messages", label: "Tin nhắn", icon: MessageCircle },
    { to: "/settings", label: "Cài đặt", icon: Settings },
  ],
  [UserRole.VET]: [
    { to: "/vet/profile", label: "Lịch khám của tôi", icon: LayoutGrid, end: true },
    { to: "/vet/medical-records", label: "Hồ sơ bệnh án", icon: FolderHeart },
    { to: "/settings", label: "Cài đặt", icon: Settings },
  ],
  [UserRole.ADMIN]: [
    { to: "/admin/partner-registrations", label: "Duyệt đối tác", icon: ClipboardCheck, end: true },
    { to: "/settings", label: "Cài đặt", icon: Settings },
  ],
};

export function Sidebar({ role }: { role: UserRole }) {
  const items = NAV_BY_ROLE[role] ?? [];

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-brand-100 bg-white/70 px-3 py-6 md:flex">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive ? "bg-brand-100 text-brand-800" : "text-brand-700/80 hover:bg-brand-50"
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}

export function hasSidebar(role: UserRole | undefined): boolean {
  return !!role && role in NAV_BY_ROLE;
}
