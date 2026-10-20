import { Injectable } from "@nestjs/common";
import type { Hospital, Pet, Post, PostComment, PostKind, PostMedia, Prisma, User, Veterinarian } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type PostWithRelations = Post & {
  user: User;
  pet: Pet | null;
  hospital: Hospital | null;
  vet: (Veterinarian & { user: User }) | null;
  media: PostMedia[];
  // Filtered to just the requester's own like (if any) — see `include()`.
  likes: { id: string }[];
  // Same idea for the requester's own bookmark — see `include()`.
  savedBy: { id: string }[];
  _count: { likes: number; comments: number };
};

export type CommentWithUser = PostComment & { user: User };

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  // `likes` is filtered to just the requester's own like (if any) so the
  // mapper can derive `likedByMe` from `likes.length > 0` without an extra
  // per-post query — see PostService/toPostDto.
  private include(requesterId: string) {
    return {
      user: true,
      pet: true,
      hospital: true,
      vet: { include: { user: true } },
      media: true,
      likes: { where: { userId: requesterId }, select: { id: true } },
      savedBy: { where: { userId: requesterId }, select: { id: true } },
      _count: { select: { likes: true, comments: true } },
    } satisfies Prisma.PostInclude;
  }

  async create(
    data: {
      userId: string;
      petId?: string;
      hospitalId?: string;
      vetId?: string;
      content?: string;
      kind?: PostKind;
      promoTitle?: string;
      discountText?: string;
      promoStartsAt?: Date;
      promoEndsAt?: Date;
      media: { mediaUrl: string; mediaType: string }[];
    },
    requesterId: string,
  ): Promise<PostWithRelations> {
    const post = await this.prisma.post.create({
      data: {
        userId: data.userId,
        petId: data.petId,
        hospitalId: data.hospitalId,
        vetId: data.vetId,
        content: data.content,
        kind: data.kind,
        promoTitle: data.promoTitle,
        discountText: data.discountText,
        promoStartsAt: data.promoStartsAt,
        promoEndsAt: data.promoEndsAt,
        media: { create: data.media },
      },
    });
    return this.findById(post.id, requesterId) as Promise<PostWithRelations>;
  }

  findById(id: string, requesterId: string): Promise<PostWithRelations | null> {
    return this.prisma.post.findUnique({ where: { id }, include: this.include(requesterId) });
  }

  // Admin-facing — every post in the system, newest first. `requesterId`
  // only affects the derived `likedByMe` flag (the admin's own likes).
  findAll(requesterId: string): Promise<PostWithRelations[]> {
    return this.prisma.post.findMany({ include: this.include(requesterId), orderBy: { createdAt: "desc" } });
  }

  findByIdRaw(id: string): Promise<Post | null> {
    return this.prisma.post.findUnique({ where: { id } });
  }

  findMany(requesterId: string, take = 30): Promise<PostWithRelations[]> {
    return this.prisma.post.findMany({ include: this.include(requesterId), orderBy: { createdAt: "desc" }, take });
  }

  // Promotions that are live right now: started (or no start date) and not
  // yet ended.
  findActivePromotions(requesterId: string, now: Date, take = 30): Promise<PostWithRelations[]> {
    return this.prisma.post.findMany({
      where: {
        kind: "PROMOTION",
        promoEndsAt: { gte: now },
        OR: [{ promoStartsAt: null }, { promoStartsAt: { lte: now } }],
      },
      include: this.include(requesterId),
      orderBy: { promoEndsAt: "asc" },
      take,
    });
  }

  findManyByPet(petId: string, requesterId: string): Promise<PostWithRelations[]> {
    return this.prisma.post.findMany({
      where: { petId },
      include: this.include(requesterId),
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
      return false;
    }
    await this.prisma.postLike.create({ data: { postId, userId } });
    return true;
  }

  async toggleSave(postId: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.savedPost.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) {
      await this.prisma.savedPost.delete({ where: { id: existing.id } });
      return false;
    }
    await this.prisma.savedPost.create({ data: { postId, userId } });
    return true;
  }

  // Newest-saved first. Posts deleted since saving are gone via cascade.
  async findSaved(userId: string): Promise<PostWithRelations[]> {
    const rows = await this.prisma.savedPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { post: { include: this.include(userId) } },
    });
    return rows.map((row) => row.post);
  }

  createComment(data: { postId: string; userId: string; content: string; parentId?: string }): Promise<CommentWithUser> {
    return this.prisma.postComment.create({ data, include: { user: true } });
  }

  findCommentsByPost(postId: string): Promise<CommentWithUser[]> {
    return this.prisma.postComment.findMany({
      where: { postId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
  }

  findCommentById(id: string): Promise<PostComment | null> {
    return this.prisma.postComment.findUnique({ where: { id } });
  }

  async deleteComment(id: string): Promise<void> {
    await this.prisma.postComment.delete({ where: { id } });
  }
}
