import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "../api/appointments.api";
import { AppointmentStatusBadge } from "../components/AppointmentStatusBadge";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

export function MyAppointmentsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["appointments", "mine"], queryFn: appointmentsApi.listMine });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancelMine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] }),
  });

  function handleCancel(id: string, petName: string) {
    if (window.confirm(`Huỷ lịch hẹn cho ${petName}?`)) {
      cancelMutation.mutate(id);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">Lịch hẹn của tôi</h1>

      {cancelMutation.isError ? (
        <div className="mb-4">
          <Alert message={extractErrorMessage(cancelMutation.error)} />
        </div>
      ) : null}

      {query.isLoading ? <LoadingState /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState
          title="Bạn chưa có lịch hẹn nào"
          description="Hãy tìm phòng khám từ trang hồ sơ thú cưng để đặt lịch."
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((appointment) => (
          <Card key={appointment.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-brand-900">
                  {appointment.petName} · {appointment.serviceName}
                </p>
                <p className="text-sm text-brand-700/80">{appointment.hospitalName}</p>
                <p className="text-sm text-brand-700/80">{formatDateTime(appointment.dateTime)}</p>
                {appointment.vetName ? (
                  <p className="text-sm text-brand-700/70">Bác sĩ mong muốn: {appointment.vetName}</p>
                ) : null}
                {appointment.notes ? <p className="mt-1 text-sm text-brand-700/70">{appointment.notes}</p> : null}
              </div>
              <AppointmentStatusBadge status={appointment.status} />
            </div>

            {appointment.status === "PENDING" || appointment.status === "CONFIRMED" ? (
              <button
                onClick={() => handleCancel(appointment.id, appointment.petName)}
                disabled={cancelMutation.isPending}
                className="mt-4 text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
              >
                Huỷ lịch hẹn
              </button>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
