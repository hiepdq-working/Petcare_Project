import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { MedicalRecordContent } from "@petcare/types";
import { medicalRecordsApi } from "../api/medical-records.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";

const CONTENT_FIELDS: { key: keyof MedicalRecordContent; label: string }[] = [
  { key: "symptoms", label: "Triệu chứng" },
  { key: "cause", label: "Nguyên nhân" },
  { key: "diagnosis", label: "Chẩn đoán" },
  { key: "treatment", label: "Điều trị" },
  { key: "conclusion", label: "Kết luận" },
  { key: "notes", label: "Ghi chú" },
];

export function CreateMedicalRecordPage() {
  const [searchParams] = useSearchParams();
  const petId = searchParams.get("petId") ?? "";
  const petName = searchParams.get("petName") ?? "thú cưng";
  const navigate = useNavigate();
  const [form, setForm] = useState<MedicalRecordContent>({});

  const mutation = useMutation({
    mutationFn: () => medicalRecordsApi.create({ petId, ...form }),
    onSuccess: (record) => navigate(`/medical-records/${record.id}`),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  const hasContent = Object.values(form).some((value) => value && value.trim().length > 0);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/vet/profile" className="text-sm text-brand-700 hover:underline">
        ← Quay lại
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-brand-900">Lập hồ sơ bệnh án cho {petName}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}

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

        <Button type="submit" loading={mutation.isPending} disabled={!petId || !hasContent}>
          Lưu hồ sơ bệnh án
        </Button>
      </form>
    </div>
  );
}
