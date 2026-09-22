import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vaccinationsApi } from "../api/vaccinations.api";
import { petsApi } from "../../pets/api/pets.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";
import { TextField } from "../../../shared/components/TextField";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

const emptyForm = { vaccineName: "", dateGiven: "", nextDueDate: "", notes: "" };

export function VaccinationsPage() {
  const { petId } = useParams<{ petId: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const petQuery = useQuery({ queryKey: ["pets", petId], queryFn: () => petsApi.get(petId!) });
  const query = useQuery({ queryKey: ["vaccinations", "pet", petId], queryFn: () => vaccinationsApi.listByPet(petId!) });

  const mutation = useMutation({
    mutationFn: () =>
      vaccinationsApi.create({
        petId: petId!,
        vaccineName: form.vaccineName,
        dateGiven: form.dateGiven,
        nextDueDate: form.nextDueDate || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations", "pet", petId] });
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to={`/pets/${petId}`} className="text-sm text-brand-700 hover:underline">
        ← Quay lại hồ sơ thú cưng
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Sổ tiêm phòng của {petQuery.data?.name ?? "thú cưng"}</h1>
      </div>

      {!showForm ? (
        <Button variant="ghost" className="mt-4" onClick={() => setShowForm(true)}>
          + Thêm mũi tiêm
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
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

          <div className="flex gap-3">
            <Button type="submit" loading={mutation.isPending} disabled={!form.vaccineName || !form.dateGiven}>
              Lưu
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {query.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}
        {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
        {query.data?.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
            Chưa có mũi tiêm nào được ghi nhận.
          </div>
        ) : null}
        {query.data?.map((vaccination) => (
          <div key={vaccination.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-semibold text-brand-900">{vaccination.vaccineName}</p>
            <p className="text-sm text-brand-700/80">Ngày tiêm: {formatDate(vaccination.dateGiven)}</p>
            {vaccination.nextDueDate ? (
              <p className="text-sm text-brand-700/80">Tái chủng: {formatDate(vaccination.nextDueDate)}</p>
            ) : null}
            {vaccination.notes ? <p className="mt-1 text-sm text-brand-700/70">{vaccination.notes}</p> : null}
            <p className="mt-1 text-xs text-brand-700/60">Ghi nhận bởi {vaccination.createdByName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
