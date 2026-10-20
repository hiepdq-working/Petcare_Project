import type { CreateGroupRequest, GroupDto } from "@petcare/types";
import { apiClient, unwrap } from "../../../shared/api/client";

export const groupsApi = {
  async create(input: CreateGroupRequest): Promise<GroupDto> {
    return unwrap(await apiClient.post("/groups", input));
  },
  async list(mine: boolean): Promise<GroupDto[]> {
    return unwrap(await apiClient.get("/groups", { params: mine ? { mine: "true" } : undefined }));
  },
  async getOne(id: string): Promise<GroupDto> {
    return unwrap(await apiClient.get(`/groups/${id}`));
  },
  async join(id: string): Promise<GroupDto> {
    return unwrap(await apiClient.post(`/groups/${id}/join`));
  },
  async leave(id: string): Promise<GroupDto> {
    return unwrap(await apiClient.post(`/groups/${id}/leave`));
  },
};
