import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { RequestAuth } from "./jwt-payload";

// Usage: register(@CurrentUser() auth: RequestAuth) in a route guarded by JwtAuthGuard.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestAuth => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.auth) {
    throw new Error("CurrentUser used outside of a JwtAuthGuard-protected route");
  }
  return req.auth;
});
