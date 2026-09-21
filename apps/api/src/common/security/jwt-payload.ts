import type { UserRole } from "@petcare/types";

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
}

export interface RequestAuth {
  userId: string;
  role: UserRole;
}

declare module "express" {
  interface Request {
    auth?: RequestAuth;
  }
}
