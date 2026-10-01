import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StaffPosition } from "@petcare/types";
import { Users, Stethoscope, PauseCircle, Plus } from "lucide-react";
import { vetsApi } from "../api/vets.api";
import { hospitalStaffApi } from "../api/hospital-staff.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { StatCard } from "../../../shared/components/StatCard";
import { PillTabs } from "../../../shared/components/PillTabs";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

type Kind = "VET" | StaffPosition;

interface Member {
  id: string;
  kind: Kind;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  subtitle: string | null;
}

const KIND_LABELS: Record<Kind, string> = {
  VET: "Bác sĩ",
  NURSE: "Điều dưỡng",
  RECEPTIONIST: "Lễ tân",
};

const TABS: { value: Kind | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "VET", label: "Bác sĩ" },
  { value: "NURSE", label: "Điều dưỡng" },
  { value: "RECEPTIONIST", label: "Lễ tân" },
];

const emptyVetForm = { name: "", email: "", phone: "", specialty: "", experience: "", licenseNumber: "" };
const emptyStaffForm = { name: "", email: "", phone: "", position: "NURSE" as StaffPosition };

export function VetsManagementPage() {
  const queryClient = useQueryClient();
  const vetsQuery = useQuery({ queryKey: ["vets"], queryFn: vetsApi.list });
  const staffQuery = useQuery({ queryKey: ["hospital-staff"], queryFn: hospitalStaffApi.list });

  const [tab, setTab] = useState<Kind | "ALL">("ALL");
  const [showVetForm, setShowVetForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [vetForm, setVetForm] = useState(emptyVetForm);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);

  const createVetMutation = useMutation({
    mutationFn: () =>
      vetsApi.create({
        name: vetForm.name,
        email: vetForm.email,
        phone: vetForm.phone || undefined,
        specialty: vetForm.specialty || undefined,
        experience: vetForm.experience ? Number(vetForm.experience) : undefined,
        licenseNumber: vetForm.licenseNumber || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vets"] });
      setVetForm(emptyVetForm);
      setShowVetForm(false);
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: () =>
      hospitalStaffApi.create({
        name: staffForm.name,
        email: staffForm.email,
        phone: staffForm.phone || undefined,
        position: staffForm.position,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-staff"] });
      setStaffForm(emptyStaffForm);
      setShowStaffForm(false);
    },
  });

  const vetStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => vetsApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vets"] }),
  });

  const staffStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => hospitalStaffApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hospital-staff"] }),
  });

  const members = useMemo<Member[]>(() => {
    const vets: Member[] = (vetsQuery.data ?? []).map((v) => ({
      id: v.id,
      kind: "VET",
      name: v.name,
      email: v.email,
      phone: v.phone,
      status: v.status,
      subtitle: v.specialty,
    }));
    const staff: Member[] = (staffQuery.data ?? []).map((s) => ({
      id: s.id,
      kind: s.position,
      name: s.name,
      email: s.email,
      phone: s.phone,
      status: s.status,
      subtitle: null,
    }));
    return [...vets, ...staff];
  }, [vetsQuery.data, staffQuery.data]);

  const counts = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.status === "ACTIVE").length,
    }),
    [members],
  );

  const visible = useMemo(() => members.filter((m) => tab === "ALL" || m.kind === tab), [members, tab]);

  function handleVetSubmit(event: FormEvent) {
    event.preventDefault();
    createVetMutation.mutate();
  }

  function handleStaffSubmit(event: FormEvent) {
    event.preventDefault();
    createStaffMutation.mutate();
  }

  function toggleStatus(member: Member) {
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (member.kind === "VET") {
      vetStatusMutation.mutate({ id: member.id, status: nextStatus });
    } else {
      staffStatusMutation.mutate({ id: member.id, status: nextStatus });
    }
  }

  const isLoading = vetsQuery.isLoading || staffQuery.isLoading;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Đội ngũ phòng khám</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Đội ngũ</h1>
        </div>
        <div className="flex gap-2">
          <Button fullWidth={false} onClick={() => setShowVetForm((v) => !v)} className="flex items-center gap-2">
            <Plus size={16} /> {showVetForm ? "Đóng" : "Thêm bác sĩ"}
          </Button>
          <Button
            fullWidth={false}
            variant="ghost"
            onClick={() => setShowStaffForm((v) => !v)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> {showStaffForm ? "Đóng" : "Thêm nhân viên"}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard icon={<Users size={18} />} tone="mint" value={counts.total} label="Tổng nhân sự" />
        <StatCard icon={<Stethoscope size={18} />} tone="blue" value={counts.active} label="Đang hoạt động" />
        <StatCard icon={<PauseCircle size={18} />} tone="amber" value={counts.total - counts.active} label="Tạm ngưng" />
      </div>

      {showVetForm ? (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-brand-900">Thêm bác sĩ</h2>
          <form onSubmit={handleVetSubmit} className="flex flex-col gap-4">
            {createVetMutation.isError ? <Alert message={extractErrorMessage(createVetMutation.error)} /> : null}
            <TextField
              label="Tên bác sĩ"
              required
              value={vetForm.name}
              onChange={(e) => setVetForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Email"
              type="email"
              required
              value={vetForm.email}
              onChange={(e) => setVetForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="Số điện thoại (không bắt buộc)"
              value={vetForm.phone}
              onChange={(e) => setVetForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <TextField
              label="Chuyên khoa (không bắt buộc)"
              value={vetForm.specialty}
              onChange={(e) => setVetForm((f) => ({ ...f, specialty: e.target.value }))}
            />
            <TextField
              label="Số năm kinh nghiệm (không bắt buộc)"
              type="number"
              min="0"
              value={vetForm.experience}
              onChange={(e) => setVetForm((f) => ({ ...f, experience: e.target.value }))}
            />
            <TextField
              label="Số chứng chỉ hành nghề (không bắt buộc)"
              value={vetForm.licenseNumber}
              onChange={(e) => setVetForm((f) => ({ ...f, licenseNumber: e.target.value }))}
            />
            <Button type="submit" loading={createVetMutation.isPending}>
              Tạo tài khoản bác sĩ
            </Button>
          </form>
        </Card>
      ) : null}

      {showStaffForm ? (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-brand-900">Thêm nhân viên</h2>
          <form onSubmit={handleStaffSubmit} className="flex flex-col gap-4">
            {createStaffMutation.isError ? <Alert message={extractErrorMessage(createStaffMutation.error)} /> : null}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="position" className="text-sm font-medium text-brand-900">
                Vai trò
              </label>
              <select
                id="position"
                value={staffForm.position}
                onChange={(e) => setStaffForm((f) => ({ ...f, position: e.target.value as StaffPosition }))}
                className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
              >
                <option value="NURSE">Điều dưỡng</option>
                <option value="RECEPTIONIST">Lễ tân</option>
              </select>
            </div>
            <TextField
              label="Tên nhân viên"
              required
              value={staffForm.name}
              onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Email"
              type="email"
              required
              value={staffForm.email}
              onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="Số điện thoại (không bắt buộc)"
              value={staffForm.phone}
              onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Button type="submit" loading={createStaffMutation.isPending}>
              Tạo tài khoản nhân viên
            </Button>
          </form>
        </Card>
      ) : null}

      <div className="mb-4">
        <PillTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {isLoading ? <LoadingState /> : null}
      {!isLoading && visible.length === 0 ? (
        <EmptyState title="Chưa có nhân sự nào ở mục này" description="Hãy thêm bác sĩ hoặc nhân viên đầu tiên của phòng khám." />
      ) : null}

      <div className="flex flex-col gap-3">
        {visible.map((member) => (
          <Card key={`${member.kind}-${member.id}`} className="flex items-start justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {member.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-semibold text-brand-900">
                  {member.name} <span className="font-normal text-brand-700/60">· {KIND_LABELS[member.kind]}</span>
                </p>
                <p className="text-sm text-brand-700/80">
                  {member.email}
                  {member.phone ? ` · ${member.phone}` : ""}
                </p>
                {member.subtitle ? <p className="text-sm text-brand-700/80">{member.subtitle}</p> : null}
              </div>
            </div>
            <button
              onClick={() => toggleStatus(member)}
              disabled={vetStatusMutation.isPending || staffStatusMutation.isPending}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
                member.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {member.status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
