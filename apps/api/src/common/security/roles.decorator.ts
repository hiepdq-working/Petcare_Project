import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@petcare/types";

export const ROLES_KEY = "roles";

// Business-level authorization (see ARCHITECTURE.md "policy" concept) —
// JwtAuthGuard only proves WHO is calling, @Roles()+RolesGuard proves
// they're ALLOWED. Usage: @Roles(UserRole.ADMIN) above a controller method.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
