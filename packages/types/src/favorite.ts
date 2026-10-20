export interface FavoriteHospitalDto {
  id: string;
  name: string;
  logo: string | null;
  cover: string | null;
  address: string | null;
  phone: string | null;
  isEmergency: boolean;
  favoritedAt: string;
}

export interface ToggleFavoriteResponse {
  favorited: boolean;
}
