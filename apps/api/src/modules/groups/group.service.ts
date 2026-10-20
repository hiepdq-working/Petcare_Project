import { Injectable } from "@nestjs/common";
import type { GroupDto } from "@petcare/types";
import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { GroupRepository } from "./group.repository";
import { toGroupDto } from "./group.types";
import type { CreateGroupInput } from "./group.validator";

@Injectable()
export class GroupService {
  constructor(private readonly repository: GroupRepository) {}

  async create(userId: string, input: CreateGroupInput): Promise<GroupDto> {
    const group = await this.repository.create(userId, input);
    return toGroupDto(group, userId);
  }

  async list(userId: string, mineOnly: boolean): Promise<GroupDto[]> {
    const groups = await this.repository.findMany(userId, mineOnly);
    return groups.map((g) => toGroupDto(g, userId));
  }

  async getOne(id: string, userId: string): Promise<GroupDto> {
    const group = await this.repository.findById(id, userId);
    if (!group) {
      throw new NotFoundError("Không tìm thấy nhóm");
    }
    return toGroupDto(group, userId);
  }

  async join(id: string, userId: string): Promise<GroupDto> {
    const group = await this.repository.findByIdRaw(id);
    if (!group) {
      throw new NotFoundError("Không tìm thấy nhóm");
    }
    await this.repository.join(id, userId);
    return this.getOne(id, userId);
  }

  async leave(id: string, userId: string): Promise<GroupDto> {
    const group = await this.repository.findByIdRaw(id);
    if (!group) {
      throw new NotFoundError("Không tìm thấy nhóm");
    }
    if (group.ownerId === userId) {
      throw new ConflictError("Chủ nhóm không thể rời nhóm");
    }
    await this.repository.leave(id, userId);
    return this.getOne(id, userId);
  }
}
