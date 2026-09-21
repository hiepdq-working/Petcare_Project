import type { Response } from "express";
import { env, isProduction } from "../../config/env";

export const REFRESH_TOKEN_COOKIE = "petcare_refresh_token";

// Refresh token travels only via httpOnly cookie (JS on the client can't
// read it, so a XSS payload can't exfiltrate it) — see ARCHITECTURE.md /
// Bàn giao notes on why refresh tokens aren't JWTs.
export function setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: env.cookieDomain,
    path: "/api/auth",
    expires: expiresAt,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: env.cookieDomain,
    path: "/api/auth",
  });
}
