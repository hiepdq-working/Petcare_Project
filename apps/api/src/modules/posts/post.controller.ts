import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { PostService } from "./post.service";
import {
  createCommentSchema,
  createPostSchema,
  type CreateCommentInput,
  type CreatePostInput,
} from "./post.validator";

@Controller("posts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PET_OWNER, UserRole.HOSPITAL_OWNER)
export class PostController {
  constructor(private readonly service: PostService) {}

  @Post()
  async create(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(createPostSchema)) body: CreatePostInput,
  ) {
    const post = await this.service.create(auth.userId, auth.role, body);
    return ok(post, "Đã đăng bài viết");
  }

  @Get()
  async listFeed(@CurrentUser() auth: RequestAuth) {
    const posts = await this.service.listFeed(auth.userId);
    return ok(posts);
  }

  @Get("pet/:petId")
  async listByPet(@CurrentUser() auth: RequestAuth, @Param("petId") petId: string) {
    const posts = await this.service.listByPet(petId, auth.userId);
    return ok(posts);
  }

  // Admin moderation — method-level @Roles overrides the class-level
  // PET_OWNER/HOSPITAL_OWNER list (RolesGuard uses getAllAndOverride), so
  // this doesn't unlock authoring/liking/commenting for Admin, only these
  // two routes.
  @Get("admin/all")
  @Roles(UserRole.ADMIN)
  async adminListAll(@CurrentUser() auth: RequestAuth) {
    const posts = await this.service.listAllForAdmin(auth.userId);
    return ok(posts);
  }

  @Delete("admin/:id")
  @Roles(UserRole.ADMIN)
  async adminRemove(@Param("id") id: string) {
    await this.service.removeAsAdmin(id);
    return ok(null, "Đã xoá bài viết");
  }

  @Get(":id")
  async getOne(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const detail = await this.service.getOne(id, auth.userId);
    return ok(detail);
  }

  @Delete(":id")
  async remove(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    await this.service.remove(id, auth.userId);
    return ok(null, "Đã xoá bài viết");
  }

  @Post(":id/like")
  async toggleLike(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const result = await this.service.toggleLike(id, auth.userId);
    return ok(result);
  }

  @Post(":id/comments")
  async addComment(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createCommentSchema)) body: CreateCommentInput,
  ) {
    const comment = await this.service.addComment(id, auth.userId, body);
    return ok(comment, "Đã bình luận");
  }

  @Delete(":id/comments/:commentId")
  async removeComment(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Param("commentId") commentId: string,
  ) {
    await this.service.removeComment(id, commentId, auth.userId);
    return ok(null, "Đã xoá bình luận");
  }
}
