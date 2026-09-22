import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { PetEventDto, PetEventType } from "@petcare/types";
import { petsApi } from "../../pets/api/pets.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

function EventCard({ event }: { event: PetEventDto }) {
  const title = (event.payload?.title as string | undefined) ?? EVENT_LABEL[event.eventType];
  const summary = event.payload?.summary as string | undefined;

  const body = (
    <Card className="flex items-start gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg">
        {EVENT_ICON[event.eventType]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-brand-900">{title}</p>
        {summary ? <p className="text-sm text-brand-700/80">{summary}</p> : null}
        <p className="mt-1 text-xs text-brand-700/60">{formatDate(event.eventDate)}</p>
      </div>
    </Card>
  );

  if (event.eventType === "MEDICAL" && event.referenceId) {
    return (
      <Link to={`/medical-records/${event.referenceId}`} className="block transition hover:opacity-80">
        {body}
      </Link>
    );
  }

  if (event.eventType === "VACCINATION") {
    return (
      <Link to={`/pets/${event.petId}/vaccinations`} className="block transition hover:opacity-80">
        {body}
      </Link>
    );
  }

  if (event.eventType === "SOCIAL_POST" && event.referenceId) {
    return (
      <Link to={`/posts/${event.referenceId}`} className="block transition hover:opacity-80">
        {body}
      </Link>
    );
  }

  return body;
}

export function PetTimelinePage() {
  const { petId } = useParams<{ petId: string }>();
  const petQuery = useQuery({ queryKey: ["pets", petId], queryFn: () => petsApi.get(petId!) });
  const timelineQuery = useQuery({ queryKey: ["pets", petId, "timeline"], queryFn: () => petsApi.getTimeline(petId!) });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to={`/pets/${petId}`} className="text-sm text-brand-700 hover:underline">
        ← Quay lại hồ sơ thú cưng
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-brand-900">
        Dòng thời gian của {petQuery.data?.name ?? "thú cưng"}
      </h1>

      <div className="mt-6 flex flex-col gap-3">
        {timelineQuery.isLoading ? <LoadingState /> : null}
        {timelineQuery.isError ? <Alert message={extractErrorMessage(timelineQuery.error)} /> : null}
        {timelineQuery.data?.length === 0 ? (
          <EmptyState title="Chưa có sự kiện nào trong dòng thời gian" />
        ) : null}
        {timelineQuery.data?.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </div>
  );
}
