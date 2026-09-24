import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@petcare/types";
import { Building2, CheckCircle2, PauseCircle, Plus } from "lucide-react";
import { hospitalApi } from "../../hospital/api/hospital.api";
import { usersApi } from "../api/users.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { StatCard } from "../../../shared/components/StatCard";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

const emptyForm = {
  name: "",
  description: "",
  address: "",
  phone: "",
  email: "",
  isEmergency: false,
  ownerId: "",
};

export function AdminHospitalsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "hospitals"], queryFn: hospitalApi.adminList });
  const ownersQuery = useQuery({
    queryKey: ["admin", "users", "HOSPITAL_OWNER"],
    queryFn: () => usersApi.list({ role: UserRole.HOSPITAL_OWNER }),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      hospitalApi.adminCreate({
        name: form.name,
        description: form.description || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        isEmergency: form.isEmergency,
        ownerId: form.ownerId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hospitals"] });
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => hospitalApi.adminUpdate(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "hospitals"] }),
  });

  const counts = useMemo(() => {
    const all = query.data ?? [];
    return { total: all.length, active: all.filter((h) => h.status === "ACTIVE").length };
  }, [query.data]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Quản trị</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Danh sách phòng khám</h1>
        </div>
        <Button fullWidth={false} onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2">
          <Plus size={16} /> {showForm ? "Đóng" : "Thêm phòng khám"}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard icon={<Building2 size={18} />} tone="mint" value={counts.total} label="Tổng phòng khám" />
        <StatCard icon={<CheckCircle2 size={18} />} tone="blue" value={counts.active} label="Đang hoạt động" />
        <StatCard icon={<PauseCircle size={18} />} tone="amber" value={counts.total - counts.active} label="Ngưng hoạt động" />
      </div>

      {showForm ? (
        <Card className="mb-6 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {createMutation.isError ? <Alert message={extractErrorMessage(createMutation.error)} /> : null}
            <TextField
              label="Tên phòng khám"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Mô tả (không bắt buộc)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <TextField
              label="Địa chỉ (không bắt buộc)"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <TextField
              label="Số điện thoại (không bắt buộc)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <TextField
              label="Email (không bắt buộc)"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ownerId" className="text-sm font-medium text-brand-900">
                Chủ phòng khám (không bắt buộc)
              </label>
              <select
                id="ownerId"
                value={form.ownerId}
                onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
                className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
              >
                <option value="">Chưa gán chủ phòng khám</option>
                {ownersQuery.data?.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-900">
              <input
                type="checkbox"
                checked={form.isEmergency}
                onChange={(e) => setForm((f) => ({ ...f, isEmergency: e.target.checked }))}
                className="h-4 w-4 rounded border-brand-300"
              />
              Hỗ trợ cấp cứu 24/7
            </label>
            <Button type="submit" loading={createMutation.isPending}>
              Tạo phòng khám
            </Button>
          </form>
        </Card>
      ) : null}

      {query.isLoading ? <LoadingState /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState title="Chưa có phòng khám nào" />
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((hospital) => (
          <Card key={hospital.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-brand-900">{hospital.name}</p>
                <p className="text-sm text-brand-700/80">{hospital.address || "Chưa có địa chỉ"}</p>
                <p className="text-sm text-brand-700/70">
                  {hospital.phone || "Chưa có SĐT"}
                  {hospital.email ? ` · ${hospital.email}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge tone={hospital.status === "ACTIVE" ? "green" : "neutral"}>
                  {hospital.status === "ACTIVE" ? "Đang hoạt động" : hospital.status === "PENDING" ? "Chờ duyệt" : "Ngưng hoạt động"}
                </Badge>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingId((cur) => (cur === hospital.id ? null : hospital.id))}
                    className="text-sm font-semibold text-brand-700 hover:underline"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() =>
                      statusMutation.mutate({
                        id: hospital.id,
                        status: hospital.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                      })
                    }
                    disabled={statusMutation.isPending}
                    className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
                  >
                    {hospital.status === "ACTIVE" ? "Vô hiệu hoá" : "Kích hoạt lại"}
                  </button>
                </div>
              </div>
            </div>

            {editingId === hospital.id ? (
              <HospitalEditForm
                hospitalId={hospital.id}
                initial={{
                  name: hospital.name,
                  description: hospital.description ?? "",
                  address: hospital.address ?? "",
                  phone: hospital.phone ?? "",
                  email: hospital.email ?? "",
                  isEmergency: hospital.isEmergency,
                }}
                onDone={() => setEditingId(null)}
              />
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

interface HospitalEditFormValues {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  isEmergency: boolean;
}

function HospitalEditForm({
  hospitalId,
  initial,
  onDone,
}: {
  hospitalId: string;
  initial: HospitalEditFormValues;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);

  const mutation = useMutation({
    mutationFn: () =>
      hospitalApi.adminUpdate(hospitalId, {
        name: form.name,
        description: form.description || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        isEmergency: form.isEmergency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hospitals"] });
      onDone();
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border-t border-brand-100 pt-4">
      {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}
      <TextField
        label="Tên phòng khám"
        required
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <TextField
        label="Địa chỉ"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
      />
      <TextField
        label="Số điện thoại"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <TextField
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <div className="flex gap-3">
        <Button type="submit" loading={mutation.isPending} fullWidth={false}>
          Lưu thay đổi
        </Button>
        <Button type="button" variant="ghost" fullWidth={false} onClick={onDone}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}
