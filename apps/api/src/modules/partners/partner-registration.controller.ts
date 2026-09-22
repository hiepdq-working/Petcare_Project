import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { BadRequestError } from "../../common/errors/app-error";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import { IpRateLimitGuard, RateLimit } from "../../common/security/ip-rate-limit.guard";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { env } from "../../config/env";
import { documentUploadOptions } from "../uploads/multer.config";
import { PartnerRegistrationService } from "./partner-registration.service";
import {
  createPartnerRegistrationSchema,
  rejectPartnerRegistrationSchema,
  type CreatePartnerRegistrationInput,
  type RejectPartnerRegistrationInput,
} from "./partner-registration.validator";

const PUBLIC_ENDPOINT_RATE_LIMIT = { limit: 10, windowMs: 10 * 60_000 };

@Controller("partner-registrations")
export class PartnerRegistrationController {
  constructor(private readonly service: PartnerRegistrationService) {}

  // Public — a prospective clinic has no account yet, so it can't upload
  // through the authenticated /uploads endpoint. Rate-limited by IP since
  // there's no logged-in identity to hold accountable otherwise.
  @Post("documents")
  @UseGuards(IpRateLimitGuard)
  @RateLimit(PUBLIC_ENDPOINT_RATE_LIMIT)
  @UseInterceptors(FileInterceptor("file", documentUploadOptions))
  uploadDocument(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestError("Vui lòng chọn file để tải lên");
    }
    return ok({ url: `${env.apiPublicUrl}/uploads/documents/${file.filename}` }, "Tải lên thành công");
  }

  // Public — a prospective clinic has no account yet. Admin vets the
  // submission (including the uploaded documents above) manually before
  // any account is created (see approve()).
  @Post()
  @UseGuards(IpRateLimitGuard)
  @RateLimit(PUBLIC_ENDPOINT_RATE_LIMIT)
  async submit(
    @Body(new ZodValidationPipe(createPartnerRegistrationSchema)) body: CreatePartnerRegistrationInput,
  ) {
    const result = await this.service.submit(body);
    return ok(null, result.message);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async list(@Query("status") status?: string) {
    const items = await this.service.listAll(status);
    return ok(items);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOne(@Param("id") id: string) {
    const item = await this.service.getOne(id);
    return ok(item);
  }

  @Post(":id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approve(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    await this.service.approve(id, auth.userId);
    return ok(null, "Đã duyệt và tạo tài khoản phòng khám");
  }

  @Post(":id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reject(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(rejectPartnerRegistrationSchema)) body: RejectPartnerRegistrationInput,
  ) {
    await this.service.reject(id, auth.userId, body.reason);
    return ok(null, "Đã từ chối đơn đăng ký");
  }
}
