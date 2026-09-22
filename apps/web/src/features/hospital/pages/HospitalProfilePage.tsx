import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hospitalApi } from "../api/hospital.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
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

export function HospitalProfilePage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["hospital", "me"], queryFn: hospitalApi.getMine });
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
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  if (query.isLoading) {
    return <p className="mx-auto max-w-xl px-4 py-8 text-brand-700">Đang tải...</p>;
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert message={extractErrorMessage(query.error)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Hồ sơ phòng khám</h1>
        <div className="flex gap-4">
          <Link to="/hospital/services" className="text-sm font-semibold text-brand-700 hover:underline">
            Dịch vụ →
          </Link>
          <Link to="/hospital/vets" className="text-sm font-semibold text-brand-700 hover:underline">
            Quản lý bác sĩ →
          </Link>
          <Link to="/hospital/appointments" className="text-sm font-semibold text-brand-700 hover:underline">
            Lịch hẹn →
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}
        {mutation.isSuccess ? <Alert kind="success" message="Đã lưu thông tin phòng khám" /> : null}

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

        <Button type="submit" loading={mutation.isPending}>
          Lưu thông tin
        </Button>
      </form>
    </div>
  );
}
