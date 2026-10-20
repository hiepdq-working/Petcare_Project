export interface GroupDto {
  id: string;
  name: string;
  description: string | null;
  cover: string | null;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  joinedByMe: boolean;
  isOwner: boolean;
  createdAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  cover?: string;
}
