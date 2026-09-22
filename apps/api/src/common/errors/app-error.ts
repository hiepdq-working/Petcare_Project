import { HttpException } from "@nestjs/common";

interface AppErrorBody {
  message: string;
  meta?: Record<string, unknown>;
}

// Base for every business-rule error thrown by a service. Extending
// Nest's HttpException means it's caught automatically by both Nest's
// own machinery and our AllExceptionsFilter — no manual mapping needed.
export class AppError extends HttpException {
  constructor(message: string, statusCode: number, meta?: Record<string, unknown>) {
    const body: AppErrorBody = meta ? { message, meta } : { message };
    super(body, statusCode);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Yêu cầu không hợp lệ", meta?: Record<string, unknown>) {
    super(message, 400, meta);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Bạn cần đăng nhập để tiếp tục") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Bạn không có quyền thực hiện hành động này") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy dữ liệu") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Dữ liệu đã tồn tại", meta?: Record<string, unknown>) {
    super(message, 409, meta);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Bạn đã thao tác quá nhiều lần, vui lòng thử lại sau") {
    super(message, 429);
  }
}
