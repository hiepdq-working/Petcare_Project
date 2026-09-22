import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { vetsApi } from "../api/vets.api";
import { appointmentsApi } from "../../appointments/api/appointments.api";
import { AppointmentStatusBadge } from "../../appointments/components/AppointmentStatusBadge";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";

// A vet may only start a medical record once the hospital has actually
// engaged with the pet — mirrors MedicalRecordRepository.hasHospitalTreatedPet
// on the backend (CONFIRMED/IN_PROGRESS/COMPLETED).
const RECORD_ELIGIBLE_STATUSES = new Set(["CONFIRMED", "IN_PROGRESS", "COMPLETED"]);

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

// First slice of the Vet role — just their own profile, now with a
// read-only appointments list. The Vet is notification-only: they can see
// what is booked with them but only the Hospital can confirm/cancel.
export function VetProfilePage() {
  const query = useQuery({ queryKey: ["vets", "me"], queryFn: vetsApi.getMyProfile });
  const appointmentsQuery = useQuery({ queryKey: ["appointments", "vet"], queryFn: appointmentsApi.listForVet });

  if (query.isLoading) {
    return <p className="mx-auto max-w-xl px-4 py-8 text-brand-700">Đang tải...</p>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert message={extractErrorMessage(query.error)} />
      </div>
    );
  }

  const vet = query.data;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Hồ sơ bác sĩ</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl">
            {vet.avatar ? (
              <img src={vet.avatar} alt={vet.name} className="h-full w-full object-cover" />
            ) : (
              "🩺"
            )}
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

      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-900">Lịch hẹn của tôi</h2>
        <Link to="/vet/medical-records" className="text-sm font-semibold text-brand-700 hover:underline">
          Hồ sơ bệnh án →
        </Link>
      </div>
      <p className="mb-4 text-sm text-brand-700/70">
        Chỉ mang tính thông báo — việc xác nhận hoặc huỷ lịch do phòng khám quyết định.
      </p>

      {appointmentsQuery.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}
      {appointmentsQuery.data?.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
          Bạn chưa có lịch hẹn nào.
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {appointmentsQuery.data?.map((appointment) => (
          <div key={appointment.id} className="rounded-2xl bg-white p-5 shadow-sm">
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
              <Link
                to={`/vet/medical-records/new?petId=${appointment.petId}&petName=${encodeURIComponent(appointment.petName)}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
              >
                Lập hồ sơ bệnh án
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
