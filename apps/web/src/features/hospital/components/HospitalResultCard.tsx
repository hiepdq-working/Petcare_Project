import type { HospitalSearchResultDto } from "@petcare/types";

export function HospitalResultCard({ hospital }: { hospital: HospitalSearchResultDto }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-100">
        {hospital.logo ? (
          <img src={hospital.logo} alt={hospital.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🏥</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-brand-900">{hospital.name}</p>
          <span className="whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            {hospital.distanceKm} km
          </span>
        </div>
        {hospital.address ? <p className="mt-0.5 truncate text-sm text-brand-700/80">{hospital.address}</p> : null}
        {hospital.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-brand-700/70">{hospital.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {hospital.isEmergency ? (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              Cấp cứu 24/7
            </span>
          ) : null}
          {hospital.phone ? (
            <a href={`tel:${hospital.phone}`} className="text-xs font-semibold text-brand-700 hover:underline">
              📞 {hospital.phone}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
