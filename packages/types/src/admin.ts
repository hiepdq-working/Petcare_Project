import type { UserRole, UserStatus } from "./enums";

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AdminCreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface AdminUpdateUserRequest {
  name?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface AdminCreateHospitalRequest {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
  isEmergency?: boolean;
  ownerId?: string;
}

export interface AdminUpdateHospitalRequest extends Partial<AdminCreateHospitalRequest> {
  status?: string;
}
