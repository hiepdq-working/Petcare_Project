import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, CalendarCheck, Rss, MessageCircle, Plus, CalendarClock, PawPrint, Video } from "lucide-react";
import { petsApi } from "../api/pets.api";
import { appointmentsApi } from "../../appointments/api/appointments.api";
import { socialApi } from "../../social/api/social.api";
import { PetCard } from "../components/PetCard";
import { useAuthStore } from "../../auth/store";
import { Card } from "../../../shared/components/Card";
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
  const [momentsTab, setMomentsTab] = useState<"photo" | "video">("photo");

  const appointmentsQuery = useQuery({ queryKey: ["appointments", "mine"], queryFn: appointmentsApi.listMine });
  const feedQuery = useQuery({ queryKey: ["posts", "feed"], queryFn: socialApi.listFeed });

  const nextAppointment = useMemo(() => {
    const upcoming = (appointmentsQuery.data ?? [])
      .filter((a) => a.status !== "CANCELLED" && new Date(a.dateTime).getTime() > Date.now())
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    return upcoming[0] ?? null;
  }, [appointmentsQuery.data]);

  const moments = useMemo(
    () => (feedQuery.data ?? []).filter((p) => p.userId === user?.id && p.media.length > 0),
    [feedQuery.data, user?.id],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm text-brand-700/70">{greeting()}, {user?.name}</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Hôm nay bé cưng của bạn thế nào?</h1>

      {/* Gradient + icon panel instead of a stock photo (none to source
          legitimately) — shows the real next appointment when there is one. */}
      <Card className="mt-6 overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white">
        {nextAppointment ? (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <CalendarClock size={20} />
            </span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-100">Lịch hẹn sắp tới</p>
            <h3 className="mt-1 font-display text-xl font-semibold">
              {nextAppointment.petName} · {nextAppointment.serviceName}
            </h3>
            <p className="mt-1 text-sm text-brand-100">
              {nextAppointment.hospitalName} ·{" "}
              {new Date(nextAppointment.dateTime).toLocaleString("vi-VN", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <Link to="/appointments" className="mt-3 inline-block text-sm font-semibold underline">
              Xem chi tiết
            </Link>
          </>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <PawPrint size={20} />
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold">Chăm bé thật tốt mỗi ngày</h3>
            <p className="mt-1 text-sm text-brand-100">
              Theo dõi sức khoẻ, đặt lịch khám và lưu lại khoảnh khắc cùng bé cưng của bạn.
            </p>
          </>
        )}
      </Card>

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

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-brand-900">Khoảnh khắc đáng yêu</h2>
        <div className="flex gap-1 rounded-full bg-brand-100 p-1">
          <button
            onClick={() => setMomentsTab("photo")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              momentsTab === "photo" ? "bg-white text-brand-800 shadow-sm" : "text-brand-700/60"
            }`}
          >
            Ảnh
          </button>
          <button
            onClick={() => setMomentsTab("video")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              momentsTab === "video" ? "bg-white text-brand-800 shadow-sm" : "text-brand-700/60"
            }`}
          >
            Video
          </button>
        </div>
      </div>

      <div className="mt-3">
        {momentsTab === "video" ? (
          <EmptyState
            icon={<Video size={20} />}
            title="Chưa hỗ trợ video"
            description="Tính năng đăng video sẽ có trong bản cập nhật sau."
          />
        ) : (
          <>
            {feedQuery.isLoading ? <LoadingState /> : null}
            {!feedQuery.isLoading && moments.length === 0 ? (
              <EmptyState title="Chưa có khoảnh khắc nào" description="Đăng ảnh đầu tiên của bé cưng ở Bảng tin." />
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              {moments.slice(0, 6).map((post) => (
                <Link
                  key={post.id}
                  to={post.petId ? `/pets/${post.petId}/timeline` : `/posts/${post.id}`}
                  className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                >
                  <div className="aspect-square w-full overflow-hidden bg-brand-100">
                    <img
                      src={post.media[0]!.mediaUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-sm font-semibold text-brand-900">
                      {post.petName ?? post.content ?? "Khoảnh khắc"}
                    </p>
                    <p className="text-xs text-brand-700/60">{post.likeCount} lượt thích</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
