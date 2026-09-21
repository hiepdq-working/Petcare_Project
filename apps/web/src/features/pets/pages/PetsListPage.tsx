import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { petsApi } from "../api/pets.api";
import { PetCard } from "../components/PetCard";

export function PetsListPage() {
  const query = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Thú cưng của bạn</h1>
        <Link
          to="/pets/new"
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + Thêm thú cưng
        </Link>
      </div>

      {query.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}

      {query.data?.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
          Bạn chưa có thú cưng nào. Hãy thêm hồ sơ đầu tiên!
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {query.data?.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );
}
