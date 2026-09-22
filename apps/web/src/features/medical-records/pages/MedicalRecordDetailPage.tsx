import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type MedicalRecordContent } from "@petcare/types";
import { medicalRecordsApi } from "../api/medical-records.api";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { LoadingState } from "../../../shared/components/LoadingState";

const CONTENT_FIELDS: { key: keyof MedicalRecordContent; label: string }[] = [
  { key: "symptoms", label: "Triệu chứng" },
  { key: "cause", label: "Nguyên nhân" },
  { key: "diagnosis", label: "Chẩn đoán" },
  { key: "treatment", label: "Điều trị" },
  { key: "conclusion", label: "Kết luận" },
  { key: "notes", label: "Ghi chú" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

export function MedicalRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAuthStore((state) => state.user?.role);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState<MedicalRecordContent>({});

  const query = useQuery({ queryKey: ["medical-records", id], queryFn: () => medicalRecordsApi.getOne(id!) });

  const versionMutation = useMutation({
    mutationFn: (input: MedicalRecordContent) => medicalRecordsApi.addVersion(id!, input),
    onSuccess: (record) => {
      queryClient.setQueryData(["medical-records", id], record);
      setEditing(false);
    },
  });

  const fileMutation = useMutation({
    mutationFn: async (file: File) => {
      const { url } = await medicalRecordsApi.uploadFile(file);
      return medicalRecordsApi.addFile(id!, { fileName: file.name, fileUrl: url, fileType: file.type || "file" });
    },
    onSuccess: (record) => {
      queryClient.setQueryData(["medical-records", id], record);
    },
  });

  function startEditing() {
    const current = query.data?.currentVersion;
    setForm({
      symptoms: current?.symptoms ?? undefined,
      cause: current?.cause ?? undefined,
      diagnosis: current?.diagnosis ?? undefined,
      treatment: current?.treatment ?? undefined,
      conclusion: current?.conclusion ?? undefined,
      notes: current?.notes ?? undefined,
    });
    setEditing(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    versionMutation.mutate(form);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) fileMutation.mutate(file);
    event.target.value = "";
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert message={extractErrorMessage(query.error)} />
      </div>
    );
  }

  const record = query.data;
  const isVet = role === UserRole.VET;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to={isVet ? "/vet/medical-records" : `/pets/${record.petId}/timeline`} className="text-sm text-brand-700 hover:underline">
        ← Quay lại
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-brand-900">Hồ sơ bệnh án của {record.petName}</h1>
      </div>
      <p className="mt-1 text-brand-700/80">
        {record.hospitalName ?? "Phòng khám"} · {record.vetName ?? "Bác sĩ"} · {formatDateTime(record.recordDate)}
      </p>

      {versionMutation.isError ? (
        <div className="mt-4">
          <Alert message={extractErrorMessage(versionMutation.error)} />
        </div>
      ) : null}

      <Card className="mt-6 p-6">
        {!editing ? (
          <>
            <dl className="flex flex-col gap-4">
              {CONTENT_FIELDS.map(({ key, label }) => {
                const value = record.currentVersion?.[key];
                if (!value) return null;
                return (
                  <div key={key}>
                    <dt className="text-sm text-brand-700/70">{label}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-brand-900">{value}</dd>
                  </div>
                );
              })}
              {!record.currentVersion ||
              CONTENT_FIELDS.every(({ key }) => !record.currentVersion?.[key]) ? (
                <p className="text-brand-700/70">Chưa có nội dung khám.</p>
              ) : null}
            </dl>

            {isVet ? (
              <Button variant="ghost" className="mt-6" onClick={startEditing}>
                Cập nhật hồ sơ
              </Button>
            ) : null}
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {CONTENT_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label htmlFor={key} className="text-sm font-medium text-brand-900">
                  {label}
                </label>
                <textarea
                  id={key}
                  rows={2}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            ))}
            <div className="flex gap-3">
              <Button type="submit" loading={versionMutation.isPending}>
                Lưu cập nhật
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Huỷ
              </Button>
            </div>
          </form>
        )}
      </Card>

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-brand-900">File đính kèm</h2>
      {fileMutation.isError ? (
        <div className="mb-3">
          <Alert message={extractErrorMessage(fileMutation.error)} />
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        {record.files.length === 0 ? <p className="text-sm text-brand-700/70">Chưa có file đính kèm.</p> : null}
        {record.files.map((file) => (
          <a
            key={file.id}
            href={file.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl bg-white p-3 text-sm text-brand-700 shadow-sm ring-1 ring-black/5 hover:underline"
          >
            📎 {file.fileName}
          </a>
        ))}
      </div>
      {isVet ? (
        <label className="mt-3 block w-fit cursor-pointer text-sm font-semibold text-brand-700 hover:underline">
          {fileMutation.isPending ? "Đang tải lên..." : "+ Đính kèm file"}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileChange} />
        </label>
      ) : null}

      <button
        onClick={() => setShowHistory((v) => !v)}
        className="mb-3 mt-8 block text-sm font-semibold text-brand-700 hover:underline"
      >
        {showHistory ? "Ẩn" : "Xem"} lịch sử chỉnh sửa ({record.versions.length})
      </button>
      {showHistory ? (
        <div className="flex flex-col gap-3">
          {record.versions.map((version) => (
            <Card key={version.id} className="p-4 text-sm">
              <p className="font-semibold text-brand-900">
                Phiên bản {version.versionNo} · {version.editedByName}
              </p>
              <p className="text-brand-700/60">{formatDateTime(version.createdAt)}</p>
              <dl className="mt-2 flex flex-col gap-1">
                {CONTENT_FIELDS.map(({ key, label }) =>
                  version[key] ? (
                    <div key={key}>
                      <span className="text-brand-700/70">{label}: </span>
                      <span className="text-brand-900">{version[key]}</span>
                    </div>
                  ) : null,
                )}
              </dl>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
