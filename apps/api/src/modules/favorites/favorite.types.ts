import type { FavoriteHospitalDto } from "@petcare/types";
import type { FavoriteWithHospital } from "./favorite.repository";

export function toFavoriteHospitalDto(favorite: FavoriteWithHospital): FavoriteHospitalDto {
  const { hospital } = favorite;
  return {
    id: hospital.id,
    name: hospital.name,
    logo: hospital.logo,
    cover: hospital.cover,
    address: hospital.address,
    phone: hospital.phone,
    isEmergency: hospital.isEmergency,
    favoritedAt: favorite.createdAt.toISOString(),
  };
}
