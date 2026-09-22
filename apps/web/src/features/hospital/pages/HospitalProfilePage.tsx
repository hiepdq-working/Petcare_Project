import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Stethoscope, Wrench, Pencil, MapPin, Phone } from "lucide-react";
import { hospitalApi } from "../api/hospital.api";
import { appointmentsApi } from "../../appointments/api/appointments.api";
import { vetsApi } from "../../vets/api/vets.api";
import { servicesApi } from "../../services/api/services.api";
import { AppointmentStatusBadge } from "../../appointments/components/AppointmentStatusBadge";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { StatCard } from "../../../shared/components/StatCard";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { ImageUploader } from "../../../shared/components/ImageUploader";
import { LocationPicker } from "../../../shared/components/LocationPicker";

interface FormState {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  isEmergency: boolean;
  logo: string | null;
  cover: string | null;
  lat: number | undefined;
  lng: number | undefined;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  address: "",
  phone: "",
  email: "",
  isEmergency: false,
  logo: null,
  cover: null,
  lat: undefined,
  lng: undefined,
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function HospitalProfilePage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"overview" | "edit">("overview");
  const query = useQuery({ queryKey: ["hospital", "me"], queryFn: hospitalApi.getMine });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "hospital", "ALL"],
    queryFn: () => appointmentsApi.listForHospital(),
  });
  const vetsQuery = useQuery({ queryKey: ["vets", "mine"], queryFn: vetsApi.list });
  const servicesQuery = useQuery({ queryKey: ["services", "mine"], queryFn: servicesApi.list });

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (query.data) {
      const hospital = query.data;
      setForm({
        name: hospital.name,
        description: hospital.description ?? "",
        address: hospital.address ?? "",
        phone: hospital.phone ?? "",
        email: hospital.email ?? "",
        isEmergency: hospital.isEmergency,
        logo: hospital.logo,
        cover: hospital.cover,
        lat: hospital.lat ?? undefined,
        lng: hospital.lng ?? undefined,
      });
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () =>
      hospitalApi.updateMine({
        name: form.name,
        description: form.description || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        isEmergency: form.isEmergency,
        logo: form.logo ?? undefined,
        cover: form.cover ?? undefined,
        lat: form.lat,
        lng: form.lng,
      }),
    onSuccess: (hospital) => {
      queryClient.setQueryData(["hospital", "me"], hospital);
      setMode("overview");
    },
  });

  const todayAppointments = useMemo(
    () =>
      (appointmentsQuery.data ?? [])
        .filter((a) => isToday(a.dateTime))
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [appointmentsQuery.data],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Alert message={query.error ? extractErrorMessage(query.error) : "Không tải được hồ sơ phòng khám"} />
      </div>
    );
  }

  const hospital = query.data;

  if (mode === "edit") {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">Chỉnh sửa hồ sơ phòng khám</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-6">
            {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}

            <ImageUploader
              value={form.cover}
              onChange={(url) => setForm((f) => ({ ...f, cover: url }))}
              uploadFn={hospitalApi.uploadImage}
              label="Chọn ảnh bìa"
              shape="rect"
              placeholderIcon="🏥"
            />
            <ImageUploader
              value={form.logo}
              onChange={(url) => setForm((f) => ({ ...f, logo: url }))}
              uploadFn={hospitalApi.uploadImage}
              label="Chọn logo"
              shape="circle"
              placeholderIcon="🏥"
            />

            <TextField
              label="Tên phòng khám"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-brand-900">
                Giới thiệu
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-xl border border-brand-200 px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <TextField
              label="Địa chỉ"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />

            <LocationPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
            />

            <TextField
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <TextField
              label="Email liên hệ"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />

            <label className="flex items-center gap-2 text-sm text-brand-900">
              <input
                type="checkbox"
                checked={form.isEmergency}
                onChange={(e) => setForm((f) => ({ ...f, isEmergency: e.target.checked }))}
                className="h-4 w-4 rounded border-brand-300"
              />
              Hỗ trợ cấp cứu 24/7
            </label>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth={false} onClick={() => setMode("overview")}>
              Huỷ
            </Button>
            <Button type="submit" loading={mutation.isPending} className="flex-1">
              Lưu thông tin
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Bảng điều khiển phòng khám</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-brand-900">
        {greeting()}, {hospital.name}
      </h1>
      <p className="mt-1 text-sm text-brand-700/70">
        Theo dõi lịch khám, đội ngũ bác sĩ và hồ sơ phòng khám trong một nơi gọn gàng hơn.
      </p>

      <Card className="mt-6 overflow-hidden">
        <div
          className="flex h-40 items-end bg-brand-100 bg-cover bg-center sm:h-56"
          style={hospital.cover ? { backgroundImage: `url(${hospital.cover})` } : undefined}
        />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="-mt-14 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-100 text-3xl shadow-sm sm:-mt-16 sm:h-24 sm:w-24">
              {hospital.logo ? (
                <img src={hospital.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                "🏥"
              )}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold text-brand-900">{hospital.name}</h2>
                {hospital.status === "ACTIVE" ? <Badge tone="brand">Đang hoạt động</Badge> : null}
              </div>
              <p className="text-sm text-brand-700/70">{hospital.description || "Chưa có mô tả"}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-700/70">
                {hospital.address ? (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {hospital.address}
                  </span>
                ) : null}
                {hospital.phone ? (
                  <span className="flex items-center gap-1">
                    <Phone size={14} /> {hospital.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <Button fullWidth={false} onClick={() => setMode("edit")} className="flex items-center justify-center gap-2">
            <Pencil size={16} /> Chỉnh sửa
          </Button>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarDays size={18} />} tone="mint" value={todayAppointments.length} label="Lịch hẹn hôm nay" />
        <StatCard icon={<Stethoscope size={18} />} tone="blue" value={vetsQuery.data?.length ?? 0} label="Bác sĩ" />
        <StatCard icon={<Wrench size={18} />} tone="amber" value={servicesQuery.data?.length ?? 0} label="Dịch vụ" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-900">Lịch hẹn hôm nay</h3>
              <p className="text-sm text-brand-700/60">Danh sách lịch khám cần theo dõi trong ngày</p>
            </div>
            <Link to="/hospital/appointments" className="text-sm font-semibold text-brand-700 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {appointmentsQuery.isLoading ? <LoadingState /> : null}
          {!appointmentsQuery.isLoading && todayAppointments.length === 0 ? (
            <EmptyState title="Chưa có lịch hẹn hôm nay" description="Lịch hẹn mới sẽ hiển thị ở đây." />
          ) : null}
          <ul className="divide-y divide-brand-100">
            {todayAppointments.slice(0, 6).map((appt) => (
              <li key={appt.id} className="flex items-center gap-4 py-3">
                <span className="w-14 shrink-0 text-sm font-semibold text-brand-900">
                  {new Date(appt.dateTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-brand-900">{appt.petName}</span>
                    <AppointmentStatusBadge status={appt.status} />
                  </div>
                  <p className="truncate text-sm text-brand-700/70">
                    {appt.serviceName}
                    {appt.vetName ? ` • ${appt.vetName}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-brand-900">Đội ngũ bác sĩ</h3>
            <Link to="/hospital/vets" className="text-sm font-semibold text-brand-700 hover:underline">
              Quản lý
            </Link>
          </div>
          {vetsQuery.isLoading ? <LoadingState /> : null}
          {!vetsQuery.isLoading && (vetsQuery.data?.length ?? 0) === 0 ? (
            <EmptyState title="Chưa có bác sĩ" description="Mời bác sĩ đầu tiên trong mục Quản lý bác sĩ." />
          ) : null}
          <ul className="flex flex-col gap-3">
            {vetsQuery.data?.slice(0, 6).map((vet) => (
              <li key={vet.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {vet.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-900">{vet.name}</p>
                  <p className="truncate text-xs text-brand-700/60">{vet.specialty || "Chưa cập nhật chuyên khoa"}</p>
                </div>
                <Badge tone={vet.status === "ACTIVE" ? "green" : "neutral"}>
                  {vet.status === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng"}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
