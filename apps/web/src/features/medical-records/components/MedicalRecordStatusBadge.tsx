import type { MedicalRecordStatus } from "@petcare/types";
import { Badge, type BadgeTone } from "../../../shared/components/Badge";

export const MEDICAL_RECORD_STATUS_LABELS: Record<MedicalRecordStatus, string> = {
  IN_TREATMENT: "Đang điều trị",
  FOLLOW_UP: "Tái khám",
  COMPLETED: "Hoàn tất",
};

const TONES: Record<MedicalRecordStatus, BadgeTone> = {
  IN_TREATMENT: "amber",
  FOLLOW_UP: "blue",
  COMPLETED: "green",
};

export function MedicalRecordStatusBadge({ status }: { status: MedicalRecordStatus }) {
  return <Badge tone={TONES[status]}>{MEDICAL_RECORD_STATUS_LABELS[status]}</Badge>;
}
