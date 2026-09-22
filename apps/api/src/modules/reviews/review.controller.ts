import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { ReviewService } from "./review.service";
import {
  createReviewSchema,
  updateReviewSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
} from "./review.validator";

@Controller("reviews")
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  // Public — reading reviews never requires an account, same as browsing
  // hospital search results.
  @Get("hospital/:hospitalId")
  async listByHospital(@Param("hospitalId") hospitalId: string) {
    const summary = await this.service.listByHospital(hospitalId);
    return ok(summary);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PET_OWNER)
  async create(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(createReviewSchema)) body: CreateReviewInput,
  ) {
    const review = await this.service.create(auth.userId, body);
    return ok(review, "Đã gửi đánh giá");
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PET_OWNER)
  async listMine(@CurrentUser() auth: RequestAuth) {
    const reviews = await this.service.listMine(auth.userId);
    return ok(reviews);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PET_OWNER)
  async update(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateReviewSchema)) body: UpdateReviewInput,
  ) {
    const review = await this.service.update(id, auth.userId, body);
    return ok(review, "Đã cập nhật đánh giá");
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PET_OWNER)
  async remove(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    await this.service.remove(id, auth.userId);
    return ok(null, "Đã xoá đánh giá");
  }
}
