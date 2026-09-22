import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppointmentStatus } from "@petcare/types";
import { CalendarClock, Stethoscope, Clock3, CheckCircle2 } from "lucide-react";
import { appointmentsApi } from "../api/appointments.api";
import { AppointmentStatusBadge } from "../components/AppointmentStatusBadge";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { StatCard } from "../../../shared/components/StatCard";
import { PillTabs } from "../../../shared/components/PillTabs";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

const TABS: { value: AppointmentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "IN_PROGRESS", label: "Đang khám" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã huỷ" },
];

// Mirrors the backend's ALLOWED_TRANSITIONS state machine
// (apps/api/src/modules/appointments/appointment.service.ts) so the UI only
// offers actions the server will actually accept.
const NEXT_ACTIONS: Partial<Record<AppointmentStatus, { status: AppointmentStatus; label: string }[]>> = {
  PENDING: [
    { status: "CONFIRMED", label: "Xác nhận" },
    { status: "CANCELLED", label: "Huỷ" },
  ],
  CONFIRMED: [
    { status: "IN_PROGRESS", label: "Bắt đầu khám" },
    { status: "CANCELLED", label: "Huỷ" },
  ],
  IN_PROGRESS: [
    { status: "COMPLETED", label: "Hoàn thành" },
    { status: "CANCELLED", label: "Huỷ" },
  ],
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

export function HospitalAppointmentsPage() {
  const [tab, setTab] = useState<AppointmentStatus | "ALL">("ALL");
  const queryClient = useQueryClient();

  // Fetched unfiltered so the stat row and the tab filter can both work off
  // one list instead of issuing a request per tab.
  const query = useQuery({
    queryKey: ["appointments", "hospital", "ALL"],
    queryFn: () => appointmentsApi.listForHospital(),
  });

  const mutation = useMutation({
    mutationFn: (input: { id: string; status: AppointmentStatus }) =>
      appointmentsApi.updateStatus(input.id, { status: input.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments", "hospital"] }),
  });

  const counts = useMemo(() => {
    const all = query.data ?? [];
    return {
      total: all.length,
      inProgress: all.filter((a) => a.status === "IN_PROGRESS").length,
      pending: all.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED").length,
      completed: all.filter((a) => a.status === "COMPLETED").length,
    };
  }, [query.data]);

  const visible = useMemo(
    () => (query.data ?? []).filter((a) => tab === "ALL" || a.status === tab),
    [query.data, tab],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Lịch khám</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Lịch hẹn tại phòng khám</h1>
      <p className="mt-1 text-sm text-brand-700/70">Theo dõi các ca khám, tình trạng tiếp nhận và bác sĩ phụ trách.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<CalendarClock size={18} />} tone="mint" value={counts.total} label="Tổng lịch khám" />
        <StatCard icon={<Stethoscope size={18} />} tone="blue" value={counts.inProgress} label="Đang khám" />
        <StatCard icon={<Clock3 size={18} />} tone="amber" value={counts.pending} label="Chờ khám" />
        <StatCard icon={<CheckCircle2 size={18} />} tone="violet" value={counts.completed} label="Hoàn thành" />
      </div>

      <div className="mt-6 mb-4">
        <PillTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {mutation.isError ? (
        <div className="mb-4">
          <Alert message={extractErrorMessage(mutation.error)} />
        </div>
      ) : null}

      {query.isLoading ? <LoadingState /> : null}
      {!query.isLoading && visible.length === 0 ? (
        <EmptyState title="Không có lịch hẹn nào ở mục này" />
      ) : null}

      <div className="flex flex-col gap-3">
        {visible.map((appointment) => (
          <Card key={appointment.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-brand-900">
                  {appointment.petName} · {appointment.serviceName}
                </p>
                <p className="text-sm text-brand-700/80">{formatDateTime(appointment.dateTime)}</p>
                {appointment.vetName ? (
                  <p className="text-sm text-brand-700/70">Bác sĩ mong muốn: {appointment.vetName}</p>
                ) : null}
                {appointment.notes ? <p className="mt-1 text-sm text-brand-700/70">{appointment.notes}</p> : null}
              </div>
              <AppointmentStatusBadge status={appointment.status} />
            </div>

            {NEXT_ACTIONS[appointment.status]?.length ? (
              <div className="mt-4 flex gap-3">
                {NEXT_ACTIONS[appointment.status]!.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => mutation.mutate({ id: appointment.id, status: action.status })}
                    disabled={mutation.isPending}
                    className={`text-sm font-semibold hover:underline disabled:opacity-60 ${
                      action.status === "CANCELLED" ? "text-red-600" : "text-brand-700"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
