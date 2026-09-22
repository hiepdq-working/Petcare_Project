import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppointmentStatus } from "@petcare/types";
import { appointmentsApi } from "../api/appointments.api";
import { AppointmentStatusBadge } from "../components/AppointmentStatusBadge";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";

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

  const query = useQuery({
    queryKey: ["appointments", "hospital", tab],
    queryFn: () => appointmentsApi.listForHospital(tab === "ALL" ? undefined : tab),
  });

  const mutation = useMutation({
    mutationFn: (input: { id: string; status: AppointmentStatus }) =>
      appointmentsApi.updateStatus(input.id, { status: input.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments", "hospital"] }),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Lịch hẹn tại phòng khám</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.value ? "bg-brand-700 text-white" : "bg-white text-brand-700 hover:bg-brand-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mutation.isError ? (
        <div className="mb-4">
          <Alert message={extractErrorMessage(mutation.error)} />
        </div>
      ) : null}

      {query.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}
      {query.data?.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
          Không có lịch hẹn nào ở mục này.
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((appointment) => (
          <div key={appointment.id} className="rounded-2xl bg-white p-5 shadow-sm">
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
          </div>
        ))}
      </div>
    </div>
  );
}
