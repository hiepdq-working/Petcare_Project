import type { User } from "@prisma/client";
import type { AdminUserDto } from "@petcare/types";

export function toAdminUserDto(user: User): AdminUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}
