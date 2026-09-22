import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { appointmentsApi } from "../api/appointments.api";
import { hospitalApi } from "../../hospital/api/hospital.api";
import { servicesApi } from "../../services/api/services.api";
import { vetsApi } from "../../vets/api/vets.api";
import { petsApi } from "../../pets/api/pets.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";

export function BookAppointmentPage() {
  const { petId, hospitalId } = useParams<{ petId: string; hospitalId: string }>();
  const navigate = useNavigate();

  const petQuery = useQuery({ queryKey: ["pets", petId], queryFn: () => petsApi.get(petId!) });
  const hospitalQuery = useQuery({
    queryKey: ["hospitals", hospitalId],
    queryFn: () => hospitalApi.getPublicById(hospitalId!),
  });
  const servicesQuery = useQuery({
    queryKey: ["services", "hospital", hospitalId],
    queryFn: () => servicesApi.listPublicByHospital(hospitalId!),
  });
  const vetsQuery = useQuery({
    queryKey: ["vets", "hospital", hospitalId],
    queryFn: () => vetsApi.listPublicByHospital(hospitalId!),
  });

  const [serviceId, setServiceId] = useState("");
  const [vetId, setVetId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        petId: petId!,
        hospitalId: hospitalId!,
        serviceId,
        vetId: vetId || undefined,
        dateTime,
        notes: notes || undefined,
      }),
    onSuccess: () => navigate("/appointments"),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to={`/hospitals/${hospitalId}`} className="text-sm text-brand-700 hover:underline">
        ← Quay lại hồ sơ phòng khám
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-brand-900">Đặt lịch khám</h1>
      <p className="mt-1 text-brand-700/80">
        {petQuery.data?.name ?? "..."} tại {hospitalQuery.data?.name ?? "..."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="service" className="text-sm font-medium text-brand-900">
            Dịch vụ
          </label>
          <select
            id="service"
            required
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          >
            <option value="" disabled>
              -- Chọn dịch vụ --
            </option>
            {servicesQuery.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.price ? ` — ${item.price.toLocaleString("vi-VN")}đ` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="vet" className="text-sm font-medium text-brand-900">
            Bác sĩ mong muốn (không bắt buộc — phòng khám sẽ sắp xếp nếu để trống)
          </label>
          <select
            id="vet"
            value={vetId}
            onChange={(e) => setVetId(e.target.value)}
            className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">-- Để phòng khám sắp xếp --</option>
            {vetsQuery.data?.map((vet) => (
              <option key={vet.id} value={vet.id}>
                {vet.name}
                {vet.specialty ? ` (${vet.specialty})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dateTime" className="text-sm font-medium text-brand-900">
            Thời gian mong muốn
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            required
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium text-brand-900">
            Ghi chú cho phòng khám (không bắt buộc)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <Button type="submit" loading={mutation.isPending} disabled={!serviceId || !dateTime}>
          Gửi yêu cầu đặt lịch
        </Button>
      </form>
    </div>
  );
}
