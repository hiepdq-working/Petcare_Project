import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hospitalApi } from "../api/hospital.api";

export const RADIUS_OPTIONS = [5, 10, 20, 50];

// Shared by the public HospitalFinderPage and the pet-scoped booking
// search step — same map/geolocation/radius logic, different page chrome
// around it (see BookHospitalPage).
export function useHospitalSearch() {
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

  return { center, setCenter, radiusKm, setRadiusKm, geoError, locating, useMyLocation, query };
}
