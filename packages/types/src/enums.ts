// Mirrors prisma/schema.prisma enums exactly. Keep in sync manually —
// this package has no dependency on Prisma so Web/Mobile don't pull in
// the Prisma client just to know the shape of a role or status.

export const UserRole = {
  PET_OWNER: "PET_OWNER",
  // The clinic's own manager account, created only after Admin approves
  // its PartnerRegistration. Creates and manages VET / HOSPITAL_STAFF
  // accounts internally — Admin never touches that part.
  HOSPITAL_OWNER: "HOSPITAL_OWNER",
  HOSPITAL_STAFF: "HOSPITAL_STAFF",
  VET: "VET",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BANNED: "BANNED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const AuthProvider = {
  PASSWORD: "PASSWORD",
  GOOGLE: "GOOGLE",
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const ShopStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
} as const;
export type ShopStatus = (typeof ShopStatus)[keyof typeof ShopStatus];
