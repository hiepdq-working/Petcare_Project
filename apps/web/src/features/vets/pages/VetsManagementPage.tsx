import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Stethoscope, PauseCircle, Plus } from "lucide-react";
import { vetsApi } from "../api/vets.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { StatCard } from "../../../shared/components/StatCard";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

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

  const counts = useMemo(() => {
    const all = query.data ?? [];
    return { total: all.length, active: all.filter((v) => v.status === "ACTIVE").length };
  }, [query.data]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Đội ngũ phòng khám</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Đội ngũ bác sĩ</h1>
        </div>
        <Button fullWidth={false} onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2">
          <Plus size={16} /> {showForm ? "Đóng" : "Thêm bác sĩ"}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard icon={<Users size={18} />} tone="mint" value={counts.total} label="Tổng bác sĩ" />
        <StatCard icon={<Stethoscope size={18} />} tone="blue" value={counts.active} label="Đang hoạt động" />
        <StatCard icon={<PauseCircle size={18} />} tone="amber" value={counts.total - counts.active} label="Tạm ngưng" />
      </div>

      {showForm ? (
        <Card className="mb-6 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        </Card>
      ) : null}

      {query.isLoading ? <LoadingState /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState title="Chưa có bác sĩ nào" description="Hãy thêm bác sĩ đầu tiên của phòng khám." />
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((vet) => (
          <Card key={vet.id} className="flex items-start justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {vet.name.charAt(0).toUpperCase()}
              </span>
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
            </div>
            <button
              onClick={() =>
                statusMutation.mutate({ id: vet.id, status: vet.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
              }
              disabled={statusMutation.isPending}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
                vet.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {vet.status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
