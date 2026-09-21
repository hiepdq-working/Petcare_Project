import { Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";
import { BadRequestError } from "../errors/app-error";

// Keeps the Zod schemas already written (auth.validator.ts) instead of
// switching to class-validator DTOs — usage: @Body(new ZodValidationPipe(registerSchema)).
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestError("Dữ liệu không hợp lệ", {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
