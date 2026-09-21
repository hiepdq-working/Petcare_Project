import type { ApiSuccess } from "@petcare/types";

// Controllers just `return ok(data, "message")` — Nest serializes whatever
// is returned as the JSON body, so no interceptor is needed to keep the
// { success, data, message } envelope from ARCHITECTURE.md consistent.
export function ok<T>(data: T, message = "OK", meta?: Record<string, unknown>): ApiSuccess<T> {
  return { success: true, data, message, ...(meta ? { meta } : {}) };
}
