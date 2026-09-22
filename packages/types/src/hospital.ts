export interface HospitalDto {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  logo: string | null;
  cover: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  status: string;
  isEmergency: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateHospitalRequest {
  name?: string;
  description?: string;
  logo?: string;
  cover?: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  isEmergency?: boolean;
}

export interface HospitalSearchResultDto {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  cover: string | null;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  isEmergency: boolean;
  distanceKm: number;
}

export interface SearchHospitalsQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}
