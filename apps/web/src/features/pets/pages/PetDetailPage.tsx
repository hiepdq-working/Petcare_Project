import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { petsApi } from "../api/pets.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";

function formatDate(iso: string | null): string {
  if (!iso) return "Chưa cập nhật";
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function PetDetailPage() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["pets", petId], queryFn: () => petsApi.get(petId!) });

  const deleteMutation = useMutation({
    mutationFn: () => petsApi.remove(petId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      navigate("/pets");
    },
  });

  if (query.isLoading) {
    return <p className="mx-auto max-w-xl px-4 py-8 text-brand-700">Đang tải...</p>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert message={extractErrorMessage(query.error)} />
      </div>
    );
  }

  const pet = query.data;

  function handleDelete() {
    if (window.confirm(`Xoá hồ sơ của ${pet.name}? Hành động này không thể hoàn tác.`)) {
      deleteMutation.mutate();
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/pets" className="text-sm text-brand-700 hover:underline">
        ← Quay lại danh sách
      </Link>

      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-100">
            {pet.avatar ? (
              <img src={pet.avatar} alt={pet.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">🐾</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">{pet.name}</h1>
            <p className="text-brand-700/80">
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-brand-700/70">Ngày sinh</dt>
            <dd className="font-medium text-brand-900">{formatDate(pet.birthDate)}</dd>
          </div>
          <div>
            <dt className="text-brand-700/70">Cân nặng</dt>
            <dd className="font-medium text-brand-900">{pet.weight ? `${pet.weight} kg` : "Chưa cập nhật"}</dd>
          </div>
        </dl>

        {pet.notes ? (
          <div className="mt-4">
            <p className="text-sm text-brand-700/70">Ghi chú</p>
            <p className="mt-1 whitespace-pre-wrap text-brand-900">{pet.notes}</p>
          </div>
        ) : null}

        {deleteMutation.isError ? (
          <div className="mt-4">
            <Alert message={extractErrorMessage(deleteMutation.error)} />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/pets/${pet.id}/book`}
            className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Đặt lịch khám
          </Link>
          <Link
            to={`/pets/${pet.id}/timeline`}
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Dòng thời gian
          </Link>
          <Link
            to={`/pets/${pet.id}/edit`}
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Sửa hồ sơ
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleteMutation.isPending ? "Đang xoá..." : "Xoá hồ sơ"}
          </button>
        </div>
      </div>
    </div>
  );
}
