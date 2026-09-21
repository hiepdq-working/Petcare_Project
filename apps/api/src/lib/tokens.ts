import { randomBytes } from "node:crypto";

// Opaque random tokens for refresh / email-verification / password-reset.
// Not JWTs: they carry no data, so they can only be checked (and revoked)
// against what's stored in the database — see ARCHITECTURE.md.
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}
