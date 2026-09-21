import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { UnauthorizedError } from "../errors/app-error";
import type { AccessTokenPayload } from "./jwt-payload";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError();
    }

    const token = header.slice("Bearer ".length);
    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token);
      req.auth = { userId: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedError("Phiên đăng nhập đã hết hạn");
    }
  }
}
