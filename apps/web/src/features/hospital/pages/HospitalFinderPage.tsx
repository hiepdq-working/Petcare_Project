import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { hospitalApi } from "../api/hospital.api";
import { HospitalResultCard } from "../components/HospitalResultCard";
import { LocationPicker } from "../../../shared/components/LocationPicker";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { extractErrorMessage } from "../../../shared/api/client";

const RADIUS_OPTIONS = [5, 10, 20, 50];

// Public — anyone can search, no login required (only booking an
// appointment later will prompt for one). See hospitals.controller.ts.
export function HospitalFinderPage() {
  const [center, setCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [radiusKm, setRadiusKm] = useState(10);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const query = useQuery({
    queryKey: ["hospitals", "nearby", center, radiusKm],
    queryFn: () => hospitalApi.searchNearby({ lat: center!.lat, lng: center!.lng, radiusKm }),
    enabled: Boolean(center),
  });

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Trình duyệt của bạn không hỗ trợ định vị. Hãy chọn vị trí trên bản đồ bên dưới.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError("Không thể lấy vị trí của bạn. Hãy chọn vị trí trên bản đồ bên dưới.");
        setLocating(false);
      },
      { timeout: 10_000 },
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-brand-900">🐾 PetCare</span>
          <Link to="/login" className="text-sm font-semibold text-brand-700">
            Đăng nhập
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-900">Tìm phòng khám gần bạn</h1>
        <p className="mt-1 text-brand-700/80">
          Dùng vị trí hiện tại hoặc chọn trên bản đồ để tìm phòng khám thú y gần nhất.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
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
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {!center ? (
            <p className="text-center text-brand-700/70">Chọn vị trí ở trên để bắt đầu tìm kiếm.</p>
          ) : null}
          {query.isLoading ? <p className="text-center text-brand-700">Đang tìm kiếm...</p> : null}
          {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
          {query.data?.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
              Không tìm thấy phòng khám nào trong bán kính {radiusKm}km. Hãy thử tăng bán kính.
            </div>
          ) : null}
          {query.data?.map((hospital) => <HospitalResultCard key={hospital.id} hospital={hospital} />)}
        </div>
      </div>
    </div>
  );
}
