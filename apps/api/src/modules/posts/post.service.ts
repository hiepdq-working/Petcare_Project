import { Injectable } from "@nestjs/common";
import type { PostDetailDto, PostDto } from "@petcare/types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { PetEventService } from "../pet-events/pet-event.service";
import { PetRepository } from "../pets/pet.repository";
import { PostRepository } from "./post.repository";
import { toCommentDto, toPostDto } from "./post.types";
import type { CreateCommentInput, CreatePostInput } from "./post.validator";

@Injectable()
export class PostService {
  constructor(
    private readonly repository: PostRepository,
    private readonly petRepository: PetRepository,
    private readonly petEventService: PetEventService,
  ) {}

  async create(userId: string, input: CreatePostInput): Promise<PostDto> {
    if (input.petId) {
      const pet = await this.petRepository.findById(input.petId);
      if (!pet) {
        throw new NotFoundError("Không tìm thấy thú cưng");
      }
      if (pet.ownerId !== userId) {
        throw new ForbiddenError("Thú cưng này không thuộc tài khoản của bạn");
      }
    }

    const post = await this.repository.create(
      { userId, petId: input.petId, content: input.content, media: input.media ?? [] },
      userId,
    );

    if (input.petId) {
      await this.petEventService.publish({
        petId: input.petId,
        eventType: "SOCIAL_POST",
        eventDate: post.createdAt,
        referenceType: "Post",
        referenceId: post.id,
        payload: { title: "Bài viết mới", summary: input.content?.slice(0, 100) ?? "Đã chia sẻ ảnh mới" },
        createdById: userId,
      });
    }

    return toPostDto(post);
  }

  async listFeed(userId: string): Promise<PostDto[]> {
    const posts = await this.repository.findMany(userId);
    return posts.map(toPostDto);
  }

  async listByPet(petId: string, userId: string): Promise<PostDto[]> {
    const posts = await this.repository.findManyByPet(petId, userId);
    return posts.map(toPostDto);
  }

  async getOne(id: string, userId: string): Promise<PostDetailDto> {
    const post = await this.repository.findById(id, userId);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài viết");
    }
    const comments = await this.repository.findCommentsByPost(id);
    return { post: toPostDto(post), comments: comments.map(toCommentDto) };
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.repository.findByIdRaw(id);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài viết");
    }
    if (post.userId !== userId) {
      throw new ForbiddenError("Bạn không có quyền xoá bài viết này");
    }
    await this.repository.delete(id);
  }

  async toggleLike(id: string, userId: string): Promise<{ liked: boolean }> {
    const post = await this.repository.findByIdRaw(id);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài viết");
    }
    const liked = await this.repository.toggleLike(id, userId);
    return { liked };
  }

  async addComment(id: string, userId: string, input: CreateCommentInput) {
    const post = await this.repository.findByIdRaw(id);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài viết");
    }
    if (input.parentId) {
      const parent = await this.repository.findCommentById(input.parentId);
      if (!parent || parent.postId !== id) {
        throw new BadRequestError("Bình luận gốc không hợp lệ");
      }
    }
    const comment = await this.repository.createComment({
      postId: id,
      userId,
      content: input.content,
      parentId: input.parentId,
    });
    return toCommentDto(comment);
  }

  async removeComment(postId: string, commentId: string, userId: string): Promise<void> {
    const comment = await this.repository.findCommentById(commentId);
    if (!comment || comment.postId !== postId) {
      throw new NotFoundError("Không tìm thấy bình luận");
    }
    if (comment.userId !== userId) {
      throw new ForbiddenError("Bạn không có quyền xoá bình luận này");
    }
    await this.repository.deleteComment(commentId);
  }
}
