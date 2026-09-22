export interface ServiceDto {
  id: string;
  hospitalId: string;
  name: string;
  description: string | null;
  price: number | null;
  duration: number | null;
  createdAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price?: number;
  duration?: number;
}

export type UpdateServiceRequest = Partial<CreateServiceRequest>;
