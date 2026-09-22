import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "../api/services.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";

const emptyForm = { name: "", description: "", price: "", duration: "" };

function formatPrice(price: number | null): string {
  if (price === null) return "Chưa cập nhật";
  return `${price.toLocaleString("vi-VN")} đ`;
}

export function ServicesManagementPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["services"], queryFn: servicesApi.list });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const createMutation = useMutation({
    mutationFn: () =>
      servicesApi.create({
        name: form.name,
        description: form.description || undefined,
        price: form.price ? Number(form.price) : undefined,
        duration: form.duration ? Number(form.duration) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Xoá dịch vụ "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Dịch vụ của phòng khám</h1>
        <Button onClick={() => setShowForm((v) => !v)} className="!w-auto px-4">
          {showForm ? "Đóng" : "+ Thêm dịch vụ"}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
          {createMutation.isError ? <Alert message={extractErrorMessage(createMutation.error)} /> : null}
          <TextField
            label="Tên dịch vụ"
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
            label="Giá (VNĐ, không bắt buộc)"
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
          <TextField
            label="Thời lượng (phút, không bắt buộc)"
            type="number"
            min="1"
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          />
          <Button type="submit" loading={createMutation.isPending}>
            Thêm dịch vụ
          </Button>
        </form>
      ) : null}

      {query.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}

      {query.data?.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
          Chưa có dịch vụ nào. Hãy thêm dịch vụ đầu tiên!
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div>
              <p className="font-semibold text-brand-900">{item.name}</p>
              {item.description ? <p className="text-sm text-brand-700/80">{item.description}</p> : null}
              <p className="mt-1 text-sm text-brand-700/70">
                {formatPrice(item.price)}
                {item.duration ? ` · ${item.duration} phút` : ""}
              </p>
            </div>
            <button
              onClick={() => handleDelete(item.id, item.name)}
              disabled={deleteMutation.isPending}
              className="whitespace-nowrap text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
            >
              Xoá
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
