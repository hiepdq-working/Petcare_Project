import { Link } from "react-router-dom";
import { useHospitalSearch, RADIUS_OPTIONS } from "../hooks/useHospitalSearch";
import { HospitalResultCard } from "../components/HospitalResultCard";
import { LocationPicker } from "../../../shared/components/LocationPicker";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { extractErrorMessage } from "../../../shared/api/client";

// Public — anyone can search, no login required (only booking an
// appointment later will prompt for one). See hospitals.controller.ts.
export function HospitalFinderPage() {
  const { center, setCenter, radiusKm, setRadiusKm, geoError, locating, useMyLocation, query } = useHospitalSearch();

  return (
    <div className="min-h-screen bg-app-gradient">
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-lg">🐾</span>
            <span className="font-display text-lg font-semibold text-brand-900">PetCare</span>
          </Link>
          <Link to="/login" className="text-sm font-semibold text-brand-700">
            Đăng nhập
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand-900">Tìm phòng khám gần bạn</h1>
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
            <LocationPicker
              lat={center?.lat}
              lng={center?.lng}
              onChange={(lat, lng) => setCenter({ lat, lng })}
            />
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
          {!center ? (
            <p className="text-center text-brand-700/70">Chọn vị trí ở trên để bắt đầu tìm kiếm.</p>
          ) : null}
          {query.isLoading ? <LoadingState label="Đang tìm kiếm..." /> : null}
          {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
          {query.data?.length === 0 ? (
            <EmptyState
              title="Không tìm thấy phòng khám nào"
              description={`Không có phòng khám trong bán kính ${radiusKm}km. Hãy thử tăng bán kính.`}
            />
          ) : null}
          {query.data?.map((hospital) => <HospitalResultCard key={hospital.id} hospital={hospital} />)}
        </div>
      </div>
    </div>
  );
}
