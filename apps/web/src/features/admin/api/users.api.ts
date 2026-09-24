import { apiClient, unwrap } from "../../../shared/api/client";
import type { AdminCreateUserRequest, AdminUpdateUserRequest, AdminUserDto, UserRole, UserStatus } from "@petcare/types";

export const usersApi = {
  async list(filter?: { role?: UserRole; status?: UserStatus }): Promise<AdminUserDto[]> {
    return unwrap(await apiClient.get("/users", { params: filter }));
  },

  async create(input: AdminCreateUserRequest): Promise<AdminUserDto> {
    return unwrap(await apiClient.post("/users", input));
  },

  async update(id: string, input: AdminUpdateUserRequest): Promise<AdminUserDto> {
    return unwrap(await apiClient.patch(`/users/${id}`, input));
  },

  async deactivate(id: string): Promise<AdminUserDto> {
    return unwrap(await apiClient.delete(`/users/${id}`));
  },
};
