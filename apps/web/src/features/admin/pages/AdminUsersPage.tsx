import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type UserStatus } from "@petcare/types";
import { Users, UserCheck, PauseCircle, Plus } from "lucide-react";
import { usersApi } from "../api/users.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { Badge, type BadgeTone } from "../../../shared/components/Badge";
import { StatCard } from "../../../shared/components/StatCard";
import { PillTabs } from "../../../shared/components/PillTabs";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

const ROLE_TABS: { value: UserRole | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: UserRole.PET_OWNER, label: "Chủ nuôi" },
  { value: UserRole.HOSPITAL_OWNER, label: "Chủ phòng khám" },
  { value: UserRole.VET, label: "Bác sĩ" },
  { value: UserRole.ADMIN, label: "Admin" },
];

const ROLE_LABEL: Record<UserRole, string> = {
  PET_OWNER: "Chủ nuôi",
  HOSPITAL_OWNER: "Chủ phòng khám",
  HOSPITAL_STAFF: "Nhân viên phòng khám",
  VET: "Bác sĩ",
  ADMIN: "Admin",
};

const ROLE_BADGE_TONE: Record<UserRole, BadgeTone> = {
  PET_OWNER: "brand",
  HOSPITAL_OWNER: "blue",
  HOSPITAL_STAFF: "violet",
  VET: "amber",
  ADMIN: "red",
};

const emptyForm = { name: "", email: "", phone: "", role: UserRole.PET_OWNER as UserRole };

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const query = useQuery({
    queryKey: ["admin", "users", "list", roleFilter],
    queryFn: () => usersApi.list(roleFilter === "ALL" ? undefined : { role: roleFilter }),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const createMutation = useMutation({
    mutationFn: () =>
      usersApi.create({ name: form.name, email: form.email, role: form.role, phone: form.phone || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      status === "INACTIVE" ? usersApi.deactivate(id) : usersApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const counts = useMemo(() => {
    const all = query.data ?? [];
    return { total: all.length, active: all.filter((u) => u.status === "ACTIVE").length };
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
          <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Người dùng</h1>
        </div>
        <Button fullWidth={false} onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2">
          <Plus size={16} /> {showForm ? "Đóng" : "Thêm người dùng"}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard icon={<Users size={18} />} tone="mint" value={counts.total} label="Tổng tài khoản" />
        <StatCard icon={<UserCheck size={18} />} tone="blue" value={counts.active} label="Đang hoạt động" />
        <StatCard icon={<PauseCircle size={18} />} tone="amber" value={counts.total - counts.active} label="Ngưng hoạt động" />
      </div>

      {showForm ? (
        <Card className="mb-6 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {createMutation.isError ? <Alert message={extractErrorMessage(createMutation.error)} /> : null}
            <TextField
              label="Họ và tên"
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-sm font-medium text-brand-900">
                Vai trò
              </label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-brand-700/60">
              Tài khoản sẽ nhận email đặt mật khẩu lần đầu — không có mật khẩu nào được tạo sẵn.
            </p>
            <Button type="submit" loading={createMutation.isPending}>
              Tạo tài khoản
            </Button>
          </form>
        </Card>
      ) : null}

      <div className="mb-4">
        <PillTabs tabs={ROLE_TABS} value={roleFilter} onChange={setRoleFilter} />
      </div>

      {query.isLoading ? <LoadingState /> : null}
      {!query.isLoading && query.data?.length === 0 ? <EmptyState title="Không có người dùng nào" /> : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((user) => (
          <Card key={user.id} className="flex items-start justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-brand-900">{user.name}</p>
                  <Badge tone={ROLE_BADGE_TONE[user.role]}>{ROLE_LABEL[user.role]}</Badge>
                </div>
                <p className="text-sm text-brand-700/80">
                  {user.email}
                  {user.phone ? ` · ${user.phone}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                statusMutation.mutate({ id: user.id, status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
              }
              disabled={statusMutation.isPending}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
                user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {user.status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
