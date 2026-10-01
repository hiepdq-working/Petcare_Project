import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { MedicalRecordStatus } from "@petcare/types";
import { FolderHeart, Stethoscope, RotateCcw, CheckCircle2 } from "lucide-react";
import { medicalRecordsApi } from "../api/medical-records.api";
import { MedicalRecordStatusBadge, MEDICAL_RECORD_STATUS_LABELS } from "../components/MedicalRecordStatusBadge";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { StatCard } from "../../../shared/components/StatCard";
import { PillTabs } from "../../../shared/components/PillTabs";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

const TABS: { value: MedicalRecordStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "IN_TREATMENT", label: MEDICAL_RECORD_STATUS_LABELS.IN_TREATMENT },
  { value: "FOLLOW_UP", label: MEDICAL_RECORD_STATUS_LABELS.FOLLOW_UP },
  { value: "COMPLETED", label: MEDICAL_RECORD_STATUS_LABELS.COMPLETED },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

export function HospitalMedicalRecordsPage() {
  const [tab, setTab] = useState<MedicalRecordStatus | "ALL">("ALL");

  // Fetched unfiltered so the stat row and the tab filter both work off one
  // list, same pattern as HospitalAppointmentsPage.
  const query = useQuery({
    queryKey: ["medical-records", "hospital", "ALL"],
    queryFn: () => medicalRecordsApi.listForHospital(),
  });

  const counts = useMemo(() => {
    const records = query.data ?? [];
    return {
      total: records.length,
      inTreatment: records.filter((r) => r.status === "IN_TREATMENT").length,
      followUp: records.filter((r) => r.status === "FOLLOW_UP").length,
      completed: records.filter((r) => r.status === "COMPLETED").length,
    };
  }, [query.data]);

  const visible = useMemo(
    () => (query.data ?? []).filter((r) => tab === "ALL" || r.status === tab),
    [query.data, tab],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Hồ sơ bệnh án</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Danh sách hồ sơ khám bệnh</h1>
      <p className="mt-1 text-sm text-brand-700/70">Theo dõi hồ sơ bệnh án do các bác sĩ trong phòng khám lập.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<FolderHeart size={18} />} tone="mint" value={counts.total} label="Tổng hồ sơ" />
        <StatCard icon={<Stethoscope size={18} />} tone="amber" value={counts.inTreatment} label="Đang điều trị" />
        <StatCard icon={<RotateCcw size={18} />} tone="blue" value={counts.followUp} label="Tái khám" />
        <StatCard icon={<CheckCircle2 size={18} />} tone="violet" value={counts.completed} label="Hoàn tất" />
      </div>

      <div className="mt-6 mb-4">
        <PillTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && visible.length === 0 ? (
        <EmptyState title="Không có hồ sơ bệnh án nào ở mục này" />
      ) : null}

      <div className="flex flex-col gap-3">
        {visible.map((record) => (
          <Link key={record.id} to={`/medical-records/${record.id}`} className="block transition hover:opacity-80">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-brand-900">
                    {record.petName} · {record.vetName ?? "Bác sĩ"}
                  </p>
                  <p className="text-sm text-brand-700/80">
                    {record.currentVersion?.diagnosis ?? "Chưa có chẩn đoán"}
                  </p>
                  <p className="text-sm text-brand-700/70">{formatDateTime(record.recordDate)}</p>
                </div>
                <MedicalRecordStatusBadge status={record.status} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
