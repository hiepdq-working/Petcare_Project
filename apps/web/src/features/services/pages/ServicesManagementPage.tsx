import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { servicesApi } from "../api/services.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Phòng khám</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Dịch vụ của phòng khám</h1>
        </div>
        <Button fullWidth={false} onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2">
          <Plus size={16} /> {showForm ? "Đóng" : "Thêm dịch vụ"}
        </Button>
      </div>

      {showForm ? (
        <Card className="mb-6 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        </Card>
      ) : null}

      {query.isLoading ? <LoadingState /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState title="Chưa có dịch vụ nào" description="Hãy thêm dịch vụ đầu tiên của phòng khám." />
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-4 p-5">
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
              className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
            >
              <Trash2 size={14} /> Xoá
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
