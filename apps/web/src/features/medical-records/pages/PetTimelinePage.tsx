import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { PetEventDto, PetEventType } from "@petcare/types";
import { Rss, Stethoscope, Syringe } from "lucide-react";
import { petsApi } from "../../pets/api/pets.api";
import { socialApi } from "../../social/api/social.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { StatCard } from "../../../shared/components/StatCard";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

const EVENT_ICON: Record<PetEventType, string> = {
  MEDICAL: "🏥",
  VACCINATION: "💉",
  WEIGHT: "⚖️",
  APPOINTMENT: "📅",
  SOCIAL_POST: "📷",
  SHOP_ORDER: "🛒",
  BIRTHDAY: "🎂",
  ADOPTION: "🏠",
  OWNERSHIP_TRANSFER: "🔄",
  AI_ALERT: "⚠️",
  REMINDER: "🔔",
};

const EVENT_LABEL: Record<PetEventType, string> = {
  MEDICAL: "Khám bệnh",
  VACCINATION: "Tiêm phòng",
  WEIGHT: "Cân nặng",
  APPOINTMENT: "Lịch hẹn",
  SOCIAL_POST: "Bài viết",
  SHOP_ORDER: "Đơn hàng",
  BIRTHDAY: "Sinh nhật",
  ADOPTION: "Nhận nuôi",
  OWNERSHIP_TRANSFER: "Chuyển chủ",
  AI_ALERT: "Cảnh báo",
  REMINDER: "Nhắc nhở",
};

const MONTH_LABELS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

function eventHref(event: PetEventDto): string | null {
  if (event.eventType === "MEDICAL" && event.referenceId) return `/medical-records/${event.referenceId}`;
  if (event.eventType === "VACCINATION") return `/pets/${event.petId}/vaccinations`;
  if (event.eventType === "SOCIAL_POST" && event.referenceId) return `/posts/${event.referenceId}`;
  return null;
}

function TimelineEntry({ event, isLast }: { event: PetEventDto; isLast: boolean }) {
  const title = (event.payload?.title as string | undefined) ?? EVENT_LABEL[event.eventType];
  const summary = event.payload?.summary as string | undefined;
  const href = eventHref(event);

  const content = (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base ring-4 ring-white">
          {EVENT_ICON[event.eventType]}
        </span>
        {!isLast ? <span className="mt-1 w-px flex-1 bg-brand-100" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <Card className="p-4 transition group-hover:shadow-md">
          <p className="font-semibold text-brand-900">{title}</p>
          {summary ? <p className="text-sm text-brand-700/80">{summary}</p> : null}
          <p className="mt-1 text-xs text-brand-700/60">{formatDate(event.eventDate)}</p>
        </Card>
      </div>
    </div>
  );

  return href ? (
    <Link to={href} className="group block">
      {content}
    </Link>
  ) : (
    content
  );
}

export function PetTimelinePage() {
  const { petId } = useParams<{ petId: string }>();
  const petQuery = useQuery({ queryKey: ["pets", petId], queryFn: () => petsApi.get(petId!) });
  const timelineQuery = useQuery({ queryKey: ["pets", petId, "timeline"], queryFn: () => petsApi.getTimeline(petId!) });
  const postsQuery = useQuery({ queryKey: ["posts", "pet", petId], queryFn: () => socialApi.listByPet(petId!) });

  const stats = useMemo(() => {
    const events = timelineQuery.data ?? [];
    const lastVaccination = events
      .filter((e) => e.eventType === "VACCINATION")
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate))[0];
    return {
      posts: events.filter((e) => e.eventType === "SOCIAL_POST").length,
      checkups: events.filter((e) => e.eventType === "MEDICAL").length,
      lastVaccination: lastVaccination ? new Date(lastVaccination.eventDate).toLocaleDateString("vi-VN") : "Chưa có",
    };
  }, [timelineQuery.data]);

  const groups = useMemo(() => {
    const events = [...(timelineQuery.data ?? [])].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    const byMonth = new Map<string, PetEventDto[]>();
    for (const event of events) {
      const d = new Date(event.eventDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(event);
    }
    return Array.from(byMonth.entries()).map(([key, items]) => {
      const [yearStr, monthStr] = key.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      return { label: `${MONTH_LABELS[month] ?? ""} ${year}`, items };
    });
  }, [timelineQuery.data]);

  const photos = (postsQuery.data ?? []).filter((p) => p.media.length > 0);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to={`/pets/${petId}`} className="text-sm text-brand-700 hover:underline">
        ← Quay lại hồ sơ thú cưng
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-100">
          {petQuery.data?.avatar ? (
            <img src={petQuery.data.avatar} alt={petQuery.data.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">🐾</div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Digital Life</p>
          <h1 className="font-display text-2xl font-semibold text-brand-900">
            {petQuery.data?.name ?? "Thú cưng"}
          </h1>
          {petQuery.data ? (
            <p className="text-sm text-brand-700/70">
              {petQuery.data.species}
              {petQuery.data.breed ? ` · ${petQuery.data.breed}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard icon={<Rss size={18} />} tone="mint" value={stats.posts} label="Bài viết" />
        <StatCard icon={<Stethoscope size={18} />} tone="blue" value={stats.checkups} label="Lần khám" />
        <StatCard icon={<Syringe size={18} />} tone="amber" value={stats.lastVaccination} label="Mũi tiêm gần nhất" />
      </div>

      {photos.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-2 font-display text-lg font-semibold text-brand-900">Khoảnh khắc</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {photos.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-100"
              >
                <img src={post.media[0]!.mediaUrl} alt="" className="h-full w-full object-cover" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-brand-900">Hành trình</h2>

      {timelineQuery.isLoading ? <LoadingState /> : null}
      {timelineQuery.isError ? <Alert message={extractErrorMessage(timelineQuery.error)} /> : null}
      {!timelineQuery.isLoading && (timelineQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title="Chưa có sự kiện nào trong dòng thời gian" />
      ) : null}

      {groups.map((group) => (
        <div key={group.label} className="mb-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-500">{group.label}</p>
          <div className="flex flex-col">
            {group.items.map((event, index) => (
              <TimelineEntry key={event.id} event={event} isLast={index === group.items.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
