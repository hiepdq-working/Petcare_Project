import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FileHeart, Syringe } from "lucide-react";
import { vetsApi } from "../api/vets.api";
import { appointmentsApi } from "../../appointments/api/appointments.api";
import { AppointmentStatusBadge } from "../../appointments/components/AppointmentStatusBadge";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { StatCard } from "../../../shared/components/StatCard";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

// A vet may only start a medical record once the hospital has actually
// engaged with the pet — mirrors MedicalRecordRepository.hasHospitalTreatedPet
// on the backend (CONFIRMED/IN_PROGRESS/COMPLETED).
const RECORD_ELIGIBLE_STATUSES = new Set(["CONFIRMED", "IN_PROGRESS", "COMPLETED"]);

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

// First slice of the Vet role — just their own profile, now with a
// read-only appointments list. The Vet is notification-only: they can see
// what is booked with them but only the Hospital can confirm/cancel.
export function VetProfilePage() {
  const query = useQuery({ queryKey: ["vets", "me"], queryFn: vetsApi.getMyProfile });
  const appointmentsQuery = useQuery({ queryKey: ["appointments", "vet"], queryFn: appointmentsApi.listForVet });

  const stats = useMemo(() => {
    const all = appointmentsQuery.data ?? [];
    return {
      today: all.filter((a) => isToday(a.dateTime)).length,
      eligible: all.filter((a) => RECORD_ELIGIBLE_STATUSES.has(a.status)).length,
    };
  }, [appointmentsQuery.data]);

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert message={extractErrorMessage(query.error)} />
      </div>
    );
  }

  const vet = query.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Bảng điều khiển bác sĩ</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Chào, {vet.name}</h1>

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl">
            {vet.avatar ? <img src={vet.avatar} alt={vet.name} className="h-full w-full object-cover" /> : "🩺"}
          </div>
          <div>
            <p className="text-lg font-semibold text-brand-900">{vet.name}</p>
            <p className="text-sm text-brand-700/80">{vet.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-brand-700/70">Chuyên khoa</dt>
            <dd className="font-medium text-brand-900">{vet.specialty ?? "Chưa cập nhật"}</dd>
          </div>
          <div>
            <dt className="text-brand-700/70">Kinh nghiệm</dt>
            <dd className="font-medium text-brand-900">
              {vet.experience !== null ? `${vet.experience} năm` : "Chưa cập nhật"}
            </dd>
          </div>
          <div>
            <dt className="text-brand-700/70">Số chứng chỉ hành nghề</dt>
            <dd className="font-medium text-brand-900">{vet.licenseNumber ?? "Chưa cập nhật"}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard icon={<CalendarDays size={18} />} tone="mint" value={stats.today} label="Lịch hẹn hôm nay" />
        <StatCard icon={<FileHeart size={18} />} tone="blue" value={stats.eligible} label="Có thể lập hồ sơ" />
        <StatCard icon={<Syringe size={18} />} tone="amber" value={appointmentsQuery.data?.length ?? 0} label="Tổng lịch hẹn" />
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-brand-900">Lịch hẹn của tôi</h2>
        <Link to="/vet/medical-records" className="text-sm font-semibold text-brand-700 hover:underline">
          Hồ sơ bệnh án →
        </Link>
      </div>
      <p className="mb-4 text-sm text-brand-700/70">
        Chỉ mang tính thông báo — việc xác nhận hoặc huỷ lịch do phòng khám quyết định.
      </p>

      {appointmentsQuery.isLoading ? <LoadingState /> : null}
      {!appointmentsQuery.isLoading && appointmentsQuery.data?.length === 0 ? (
        <EmptyState title="Bạn chưa có lịch hẹn nào" />
      ) : null}

      <div className="flex flex-col gap-3">
        {appointmentsQuery.data?.map((appointment) => (
          <Card key={appointment.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-brand-900">
                  {appointment.petName} · {appointment.serviceName}
                </p>
                <p className="text-sm text-brand-700/80">{formatDateTime(appointment.dateTime)}</p>
              </div>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            {RECORD_ELIGIBLE_STATUSES.has(appointment.status) ? (
              <div className="mt-3 flex gap-4">
                <Link
                  to={`/vet/medical-records/new?petId=${appointment.petId}&petName=${encodeURIComponent(appointment.petName)}`}
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  Lập hồ sơ bệnh án
                </Link>
                <Link
                  to={`/vet/vaccinations/new?petId=${appointment.petId}&petName=${encodeURIComponent(appointment.petName)}`}
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  Ghi nhận tiêm phòng
                </Link>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
