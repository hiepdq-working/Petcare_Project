import { Link } from "react-router-dom";
import type { PetDto } from "@petcare/types";

const SPECIES_EMOJI: Record<string, string> = {
  Chó: "🐶",
  Mèo: "🐱",
  "Bò sát": "🦎",
  "Gia súc/gia cầm": "🐔",
};

function speciesEmoji(species: string): string {
  return SPECIES_EMOJI[species] ?? "🐾";
}

function formatAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const months = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 1) return "Dưới 1 tháng tuổi";
  if (months < 12) return `${months} tháng tuổi`;
  const years = Math.floor(months / 12);
  return `${years} tuổi`;
}

// Card layout deliberately mirrors a "course card" grid (image with a
// floating pill badge, title, meta line below) per the reference the
// user shared — just softened to the brand's rounded, low-contrast style
// instead of the bold saturated original.
export function PetCard({ pet }: { pet: PetDto }) {
  const age = formatAge(pet.birthDate);
  const metaLine = pet.breed && age ? `${pet.breed} · ${age}` : pet.breed || age || "Chưa cập nhật";

  return (
    <Link
      to={`/pets/${pet.id}`}
      className="group block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-brand-100">
        {pet.avatar ? (
          <img
            src={pet.avatar}
            alt={pet.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">🐾</div>
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
          <span>{speciesEmoji(pet.species)}</span>
          {pet.species}
        </span>
      </div>
      <div className="p-3">
        <p className="truncate font-semibold text-brand-900">{pet.name}</p>
        <p className="mt-0.5 truncate text-xs text-brand-700/70">{metaLine}</p>
      </div>
    </Link>
  );
}
