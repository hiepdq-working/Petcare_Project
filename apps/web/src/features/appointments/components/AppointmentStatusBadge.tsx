import type { AppointmentStatus } from "@petcare/types";
import { Badge, type BadgeTone } from "../../../shared/components/Badge";

const LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang khám",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

const TONES: Record<AppointmentStatus, BadgeTone> = {
  PENDING: "amber",
  CONFIRMED: "brand",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}
