import type { GroupDto } from "@petcare/types";
import type { GroupWithMeta } from "./group.repository";

export function toGroupDto(group: GroupWithMeta, requesterId: string): GroupDto {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    cover: group.cover,
    ownerId: group.ownerId,
    ownerName: group.owner.name,
    memberCount: group._count.members,
    joinedByMe: group.members.length > 0,
    isOwner: group.ownerId === requesterId,
    createdAt: group.createdAt.toISOString(),
  };
}
