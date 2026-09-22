import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { vaccinationsApi } from "../api/vaccinations.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";
import { TextField } from "../../../shared/components/TextField";
import { Card } from "../../../shared/components/Card";

export function CreateVaccinationPage() {
  const [searchParams] = useSearchParams();
  const petId = searchParams.get("petId") ?? "";
  const petName = searchParams.get("petName") ?? "thú cưng";
  const navigate = useNavigate();
  const [form, setForm] = useState({ vaccineName: "", dateGiven: "", nextDueDate: "", notes: "" });

  const mutation = useMutation({
    mutationFn: () =>
      vaccinationsApi.create({
        petId,
        vaccineName: form.vaccineName,
        dateGiven: form.dateGiven,
        nextDueDate: form.nextDueDate || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => navigate("/vet/profile"),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/vet/profile" className="text-sm text-brand-700 hover:underline">
        ← Quay lại
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-brand-900">Ghi nhận tiêm phòng cho {petName}</h1>

      <Card as="form" onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 p-6">
        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}

        <TextField
          label="Tên vắc-xin"
          required
          value={form.vaccineName}
          onChange={(e) => setForm((f) => ({ ...f, vaccineName: e.target.value }))}
        />
        <TextField
          label="Ngày tiêm"
          type="date"
          required
          value={form.dateGiven}
          onChange={(e) => setForm((f) => ({ ...f, dateGiven: e.target.value }))}
        />
        <TextField
          label="Ngày tái chủng (không bắt buộc)"
          type="date"
          value={form.nextDueDate}
          onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium text-brand-900">
            Ghi chú (không bắt buộc)
          </label>
          <textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <Button type="submit" loading={mutation.isPending} disabled={!petId || !form.vaccineName || !form.dateGiven}>
          Lưu
        </Button>
      </Card>
    </div>
  );
}
