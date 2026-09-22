import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Bundlers can't resolve Leaflet's default marker image paths — point at
// the CDN copy instead of wiring up asset imports for three tiny PNGs.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009]; // Ho Chi Minh City

interface LocationPickerProps {
  lat: number | undefined;
  lng: number | undefined;
  onChange: (lat: number, lng: number) => void;
}

function ClickToSetMarker({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

// Recenters the map when `lat`/`lng` change from outside the map itself
// (e.g. loaded from the server) — MapContainer's `center` prop is only
// read once on mount.
function RecenterOnChange({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position);
    }
  }, [position, map]);
  return null;
}

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const position: [number, number] | null = lat !== undefined && lng !== undefined ? [lat, lng] : null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-brand-900">Vị trí trên bản đồ (bấm để chọn)</p>
      <div className="overflow-hidden rounded-xl border border-brand-200">
        <MapContainer center={position ?? DEFAULT_CENTER} zoom={14} style={{ height: 240, width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickToSetMarker onChange={onChange} />
          <RecenterOnChange position={position} />
          {position ? <Marker position={position} /> : null}
        </MapContainer>
      </div>
      <p className="text-xs text-brand-700/70">
        {position ? `Đã chọn: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : "Chưa chọn vị trí"}
      </p>
    </div>
  );
}
