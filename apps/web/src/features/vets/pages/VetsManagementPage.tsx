import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vetsApi } from "../api/vets.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";

const emptyForm = { name: "", email: "", phone: "", specialty: "", experience: "", licenseNumber: "" };

export function VetsManagementPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["vets"], queryFn: vetsApi.list });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const createMutation = useMutation({
    mutationFn: () =>
      vetsApi.create({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        specialty: form.specialty || undefined,
        experience: form.experience ? Number(form.experience) : undefined,
        licenseNumber: form.licenseNumber || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vets"] });
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => vetsApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vets"] }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Đội ngũ bác sĩ</h1>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="!w-auto px-4"
        >
          {showForm ? "Đóng" : "+ Thêm bác sĩ"}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
          {createMutation.isError ? <Alert message={extractErrorMessage(createMutation.error)} /> : null}
          <TextField
            label="Tên bác sĩ"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            label="Số điện thoại (không bắt buộc)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <TextField
            label="Chuyên khoa (không bắt buộc)"
            value={form.specialty}
            onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
          />
          <TextField
            label="Số năm kinh nghiệm (không bắt buộc)"
            type="number"
            min="0"
            value={form.experience}
            onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
          />
          <TextField
            label="Số chứng chỉ hành nghề (không bắt buộc)"
            value={form.licenseNumber}
            onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
          />
          <Button type="submit" loading={createMutation.isPending}>
            Tạo tài khoản bác sĩ
          </Button>
        </form>
      ) : null}

      {query.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}

      {query.data?.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
          Chưa có bác sĩ nào. Hãy thêm bác sĩ đầu tiên!
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((vet) => (
          <div key={vet.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div>
              <p className="font-semibold text-brand-900">{vet.name}</p>
              <p className="text-sm text-brand-700/80">
                {vet.email}
                {vet.phone ? ` · ${vet.phone}` : ""}
              </p>
              {vet.specialty ? <p className="text-sm text-brand-700/80">{vet.specialty}</p> : null}
              {vet.experience !== null ? (
                <p className="text-sm text-brand-700/70">{vet.experience} năm kinh nghiệm</p>
              ) : null}
            </div>
            <button
              onClick={() =>
                statusMutation.mutate({ id: vet.id, status: vet.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
              }
              disabled={statusMutation.isPending}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-60 ${
                vet.status === "ACTIVE" ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
              }`}
            >
              {vet.status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
