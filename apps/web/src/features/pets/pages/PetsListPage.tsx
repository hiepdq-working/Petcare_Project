import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, CalendarCheck, Rss, MessageCircle, Plus } from "lucide-react";
import { petsApi } from "../api/pets.api";
import { PetCard } from "../components/PetCard";
import { useAuthStore } from "../../auth/store";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const QUICK_ACTIONS = [
  { to: "/hospitals/nearby", label: "Tìm phòng khám", icon: Stethoscope, tone: "bg-sky-100 text-sky-700" },
  { to: "/appointments", label: "Lịch hẹn", icon: CalendarCheck, tone: "bg-emerald-100 text-emerald-700" },
  { to: "/feed", label: "Bảng tin", icon: Rss, tone: "bg-rose-100 text-rose-600" },
  { to: "/messages", label: "Tin nhắn", icon: MessageCircle, tone: "bg-amber-100 text-amber-700" },
];

export function PetsListPage() {
  const query = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const user = useAuthStore((state) => state.user);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm text-brand-700/70">{greeting()}, {user?.name}</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Hôm nay bé cưng của bạn thế nào?</h1>

      <div className="mt-6 grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon, tone }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2 text-center">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
              <Icon size={20} />
            </span>
            <span className="text-xs font-medium text-brand-800">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-brand-900">Thú cưng của tôi</h2>
        <Link to="/pets/new" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          <Plus size={16} /> Thêm thú cưng
        </Link>
      </div>

      <div className="mt-3">
        {query.isLoading ? <LoadingState /> : null}
        {!query.isLoading && query.data?.length === 0 ? (
          <EmptyState title="Bạn chưa có thú cưng nào" description="Hãy thêm hồ sơ đầu tiên cho bé cưng của bạn." />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {query.data?.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );
}
