export interface VetDto {
  id: string;
  hospitalId: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  specialty: string | null;
  experience: number | null;
  licenseNumber: string | null;
  status: string;
  createdAt: string;
}

export interface CreateVetRequest {
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  experience?: number;
  licenseNumber?: string;
}

export interface UpdateVetRequest {
  specialty?: string;
  experience?: number;
  licenseNumber?: string;
  status?: string;
}
