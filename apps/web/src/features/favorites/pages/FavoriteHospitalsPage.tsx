import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { favoritesApi } from "../api/favorites.api";
import { FavoriteButton } from "../components/FavoriteButton";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

export function FavoriteHospitalsPage() {
  const query = useQuery({ queryKey: ["favorites", "hospitals"], queryFn: favoritesApi.listHospitals });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">Phòng khám yêu thích</h1>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState
          title="Bạn chưa yêu thích phòng khám nào"
          description="Bấm biểu tượng trái tim ở trang phòng khám để lưu lại đây."
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((hospital) => (
          <Card key={hospital.id} className="flex items-center gap-4 p-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-100">
              {hospital.logo ? (
                <img src={hospital.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🏥</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/hospitals/${hospital.id}`} className="font-semibold text-brand-900 hover:underline">
                {hospital.name}
              </Link>
              {hospital.address ? <p className="truncate text-sm text-brand-700/80">{hospital.address}</p> : null}
              {hospital.isEmergency ? <Badge tone="red">Cấp cứu 24/7</Badge> : null}
            </div>
            <FavoriteButton hospitalId={hospital.id} />
          </Card>
        ))}
      </div>
    </div>
  );
}
