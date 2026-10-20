import { Injectable } from "@nestjs/common";
import type { Group, User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type GroupWithMeta = Group & {
  owner: User;
  // Filtered to just the requester's own membership row (if any).
  members: { id: string }[];
  _count: { members: number };
};

@Injectable()
export class GroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  private include(requesterId: string) {
    return {
      owner: true,
      members: { where: { userId: requesterId }, select: { id: true } },
      _count: { select: { members: true } },
    };
  }

  // The creator is always the first member.
  async create(ownerId: string, data: { name: string; description?: string; cover?: string }): Promise<GroupWithMeta> {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({ data: { ...data, ownerId } });
      await tx.groupMember.create({ data: { groupId: group.id, userId: ownerId } });
      return tx.group.findUniqueOrThrow({ where: { id: group.id }, include: this.include(ownerId) });
    });
  }

  findMany(requesterId: string, mineOnly: boolean): Promise<GroupWithMeta[]> {
    return this.prisma.group.findMany({
      where: mineOnly ? { members: { some: { userId: requesterId } } } : {},
      include: this.include(requesterId),
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string, requesterId: string): Promise<GroupWithMeta | null> {
    return this.prisma.group.findUnique({ where: { id }, include: this.include(requesterId) });
  }

  findByIdRaw(id: string): Promise<Group | null> {
    return this.prisma.group.findUnique({ where: { id } });
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.groupMember.count({ where: { groupId, userId } });
    return count > 0;
  }

  async join(groupId: string, userId: string): Promise<void> {
    await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    });
  }

  async leave(groupId: string, userId: string): Promise<void> {
    await this.prisma.groupMember.deleteMany({ where: { groupId, userId } });
  }
}
