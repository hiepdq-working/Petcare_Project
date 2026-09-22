import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { petsApi } from "../../pets/api/pets.api";
import { useHospitalSearch, RADIUS_OPTIONS } from "../../hospital/hooks/useHospitalSearch";
import { HospitalResultCard } from "../../hospital/components/HospitalResultCard";
import { LocationPicker } from "../../../shared/components/LocationPicker";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { extractErrorMessage } from "../../../shared/api/client";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

// Step 1 of booking: "sau khi chọn pet sẽ có mục tìm kiếm phòng khám
// thông qua map" — pet is already chosen (via the route param, set by
// the "Đặt lịch khám" button on PetDetailPage), now search for a hospital.
export function BookHospitalSearchPage() {
  const { petId } = useParams<{ petId: string }>();
  const petQuery = useQuery({ queryKey: ["pets", petId], queryFn: () => petsApi.get(petId!) });
  const { center, setCenter, radiusKm, setRadiusKm, geoError, locating, useMyLocation, query } = useHospitalSearch();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to={`/pets/${petId}`} className="text-sm text-brand-700 hover:underline">
        ← Quay lại hồ sơ thú cưng
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-brand-900">
        Tìm phòng khám cho {petQuery.data?.name ?? "thú cưng"}
      </h1>
      <p className="mt-1 text-brand-700/80">
        Dùng vị trí hiện tại hoặc chọn trên bản đồ để tìm phòng khám thú y gần nhất.
      </p>

      <Card className="mt-6 p-6">
        <Button onClick={useMyLocation} loading={locating}>
          📍 Dùng vị trí của tôi
        </Button>

        {geoError ? (
          <div className="mt-4">
            <Alert message={geoError} />
          </div>
        ) : null}

        <div className="mt-4">
          <LocationPicker lat={center?.lat} lng={center?.lng} onChange={(lat, lng) => setCenter({ lat, lng })} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="radius" className="text-sm font-medium text-brand-900">
            Bán kính tìm kiếm
          </label>
          <select
            id="radius"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
          >
            {RADIUS_OPTIONS.map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {!center ? <p className="text-center text-brand-700/70">Chọn vị trí ở trên để bắt đầu tìm kiếm.</p> : null}
        {query.isLoading ? <LoadingState label="Đang tìm kiếm..." /> : null}
        {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
        {query.data?.length === 0 ? (
          <EmptyState
            title="Không tìm thấy phòng khám nào"
            description={`Không có phòng khám trong bán kính ${radiusKm}km. Hãy thử tăng bán kính.`}
          />
        ) : null}
        {query.data?.map((hospital) => (
          <HospitalResultCard key={hospital.id} hospital={hospital} bookingPetId={petId} />
        ))}
      </div>
    </div>
  );
}
