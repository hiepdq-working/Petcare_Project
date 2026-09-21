export const PetStatus = {
  ACTIVE: "ACTIVE",
  DECEASED: "DECEASED",
  LOST: "LOST",
  TRANSFERRED: "TRANSFERRED",
} as const;
export type PetStatus = (typeof PetStatus)[keyof typeof PetStatus];

export interface PetDto {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: number | null;
  avatar: string | null;
  notes: string | null;
  status: PetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetRequest {
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  weight?: number;
  avatar?: string | null;
  notes?: string;
}

export type UpdatePetRequest = Partial<CreatePetRequest>;

export interface UploadResponse {
  url: string;
}
