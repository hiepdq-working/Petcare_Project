import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { TooManyRequestsError } from "../errors/app-error";

export const RATE_LIMIT_KEY = "rateLimit";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

// Usage: @UseGuards(IpRateLimitGuard) @RateLimit({ limit: 10, windowMs: 10 * 60_000 })
// above a PUBLIC (unauthenticated) route — anything behind JwtAuthGuard
// already has a real identity checking it, so it doesn't need this.
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory, per-process — fine for a single API instance at MVP scale.
// Move to a Redis-backed limiter if/when the API scales to multiple
// instances (see ARCHITECTURE.md roadmap: Redis is a "Phase 2" concern).
@Injectable()
export class IpRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {
    setInterval(() => this.sweep(), 10 * 60_000).unref();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt < now) {
        this.buckets.delete(key);
      }
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(RATE_LIMIT_KEY, context.getHandler());
    if (!options) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const key = `${context.getClass().name}.${context.getHandler().name}:${req.ip}`;
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      this.buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    if (bucket.count >= options.limit) {
      throw new TooManyRequestsError();
    }

    bucket.count += 1;
    return true;
  }
}
