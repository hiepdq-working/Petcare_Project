import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Response } from "express";
import type { ApiFailure } from "@petcare/types";

// Every thrown error lands here — controllers/services never format an
// error response themselves (see ARCHITECTURE.md "centralized error
// handling"). AppError and Nest's own HttpException subclasses (e.g. a
// bare `throw new NotFoundException()`) are both handled the same way.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const isObject = typeof response === "object" && response !== null;
      const message = isObject
        ? ((response as Record<string, unknown>).message as string | undefined) ?? exception.message
        : (response as string);
      const meta = isObject ? (response as Record<string, unknown>).meta : undefined;

      const body: ApiFailure = {
        success: false,
        data: null,
        message,
        ...(meta ? { meta: meta as Record<string, unknown> } : {}),
      };
      res.status(status).json(body);
      return;
    }

    console.error(exception);
    const body: ApiFailure = {
      success: false,
      data: null,
      message: "Đã có lỗi xảy ra, vui lòng thử lại sau",
    };
    res.status(500).json(body);
  }
}
