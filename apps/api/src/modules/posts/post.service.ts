import { Injectable } from "@nestjs/common";
import { UserRole, type PostDetailDto, type PostDto } from "@petcare/types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { FavoriteRepository } from "../favorites/favorite.repository";
import { GroupRepository } from "../groups/group.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { NotificationService } from "../notifications/notification.service";
import { PetEventService } from "../pet-events/pet-event.service";
import { PetRepository } from "../pets/pet.repository";
import { VetRepository } from "../vets/vet.repository";
import { PostRepository } from "./post.repository";
import { toCommentDto, toPostDto } from "./post.types";
import type { CreateCommentInput, CreatePostInput } from "./post.validator";

// A Pet Owner's post is a personal moment about their own pet, captured
// live (the frontend only offers a camera, never a file picker) — a single
// photo keeps that intent honest. A Hospital's post is more like a small
// gallery (clinic photos, a vet spotlight), so it gets the fuller 5-image
// allowance the Zod schema caps at.
const PET_OWNER_MAX_MEDIA = 1;

@Injectable()
export class PostService {
  constructor(
    private readonly repository: PostRepository,
    private readonly petRepository: PetRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly vetRepository: VetRepository,
    private readonly petEventService: PetEventService,
    private readonly favoriteRepository: FavoriteRepository,
    private readonly notificationService: NotificationService,
    private readonly groupRepository: GroupRepository,
  ) {}

  async create(userId: string, role: UserRole, input: CreatePostInput): Promise<PostDto> {
    const media = input.media ?? [];
    let hospitalId: string | undefined;

    if (input.groupId) {
      if (role !== UserRole.PET_OWNER) {
        throw new ForbiddenError("Chỉ chủ nuôi mới có thể đăng bài trong nhóm");
      }
      const group = await this.groupRepository.findByIdRaw(input.groupId);
      if (!group) {
        throw new NotFoundError("Không tìm thấy nhóm");
      }
      if (!(await this.groupRepository.isMember(input.groupId, userId))) {
        throw new ForbiddenError("Bạn cần tham gia nhóm trước khi đăng bài");
      }
    }

    if (input.kind === "PROMOTION" && role !== UserRole.HOSPITAL_OWNER) {
      throw new ForbiddenError("Chỉ phòng khám mới có thể đăng khuyến mãi");
    }

    if (role === UserRole.HOSPITAL_OWNER) {
      if (input.petId) {
        throw new BadRequestError("Phòng khám không thể gắn thẻ thú cưng vào bài viết");
      }
      const hospital = await this.hospitalRepository.findByOwnerId(userId);
      if (!hospital) {
        throw new NotFoundError("Không tìm thấy phòng khám của tài khoản này");
      }
      hospitalId = hospital.id;

      if (input.vetId) {
        const vet = await this.vetRepository.findById(input.vetId);
        if (!vet || vet.hospitalId !== hospital.id) {
          throw new BadRequestError("Bác sĩ không thuộc phòng khám này");
        }
      }
    } else {
      if (input.vetId) {
        throw new BadRequestError("Chỉ phòng khám mới có thể gắn thẻ bác sĩ vào bài viết");
      }
      if (media.length > PET_OWNER_MAX_MEDIA) {
        throw new BadRequestError("Bạn chỉ có thể đăng 1 ảnh cho mỗi bài viết");
      }
      if (input.petId) {
        const pet = await this.petRepository.findById(input.petId);
        if (!pet) {
          throw new NotFoundError("Không tìm thấy thú cưng");
        }
        if (pet.ownerId !== userId) {
          throw new ForbiddenError("Thú cưng này không thuộc tài khoản của bạn");
        }
      }
    }

    const post = await this.repository.create(
      {
        userId,
        petId: input.petId,
        hospitalId,
        vetId: input.vetId,
        groupId: input.groupId,
        content: input.content,
        kind: input.kind,
        promoTitle: input.promoTitle,
        discountText: input.discountText,
        promoStartsAt: input.promoStartsAt,
        promoEndsAt: input.promoEndsAt,
        media,
      },
      userId,
    );

    if (input.kind === "PROMOTION" && hospitalId) {
      await this.notifyPromotion(post.id, hospitalId, post.hospital?.name ?? "Phòng khám", input.promoTitle ?? "");
    }

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

  // Everyone who favorited the clinic gets a PROMOTION notification. A plain
  // loop is fine at the current scale; batch it if followers ever reach the
  // thousands.
  private async notifyPromotion(postId: string, hospitalId: string, hospitalName: string, title: string): Promise<void> {
    const followerIds = await this.favoriteRepository.findFollowerIds(hospitalId);
    for (const userId of followerIds) {
      await this.notificationService.create({
        userId,
        type: "PROMOTION",
        title: `${hospitalName}: ${title}`,
        refId: postId,
      });
    }
  }

  // Live promotions, clinics the requester favorited first, then soonest to
  // expire.
  async listPromotions(userId: string): Promise<PostDto[]> {
    const [promotions, favorites] = await Promise.all([
      this.repository.findActivePromotions(userId, new Date()),
      this.favoriteRepository.findManyByUser(userId),
    ]);
    const favoriteIds = new Set(favorites.map((f) => f.hospitalId));
    const rank = (hospitalId: string | null) => (hospitalId && favoriteIds.has(hospitalId) ? 0 : 1);
    return promotions
      .sort((a, b) => rank(a.hospitalId) - rank(b.hospitalId) || a.promoEndsAt!.getTime() - b.promoEndsAt!.getTime())
      .slice(0, 10)
      .map(toPostDto);
  }

  async listFeed(userId: string): Promise<PostDto[]> {
    const posts = await this.repository.findMany(userId);
    return posts.map(toPostDto);
  }

  async listByGroup(groupId: string, userId: string): Promise<PostDto[]> {
    if (!(await this.groupRepository.findByIdRaw(groupId))) {
      throw new NotFoundError("Không tìm thấy nhóm");
    }
    if (!(await this.groupRepository.isMember(groupId, userId))) {
      throw new ForbiddenError("Bạn cần tham gia nhóm để xem bài viết");
    }
    const posts = await this.repository.findManyByGroup(groupId, userId);
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
    // The author may delete their own post; a group's owner may also remove
    // any post inside that group.
    let canDelete = post.userId === userId;
    if (!canDelete && post.groupId) {
      const group = await this.groupRepository.findByIdRaw(post.groupId);
      canDelete = group?.ownerId === userId;
    }
    if (!canDelete) {
      throw new ForbiddenError("Bạn không có quyền xoá bài viết này");
    }
    await this.repository.delete(id);
  }

  // Admin moderation — every post regardless of author, and delete bypasses
  // the ownership check `remove()` enforces above.
  async listAllForAdmin(requesterId: string): Promise<PostDto[]> {
    const posts = await this.repository.findAll(requesterId);
    return posts.map(toPostDto);
  }

  async removeAsAdmin(id: string): Promise<void> {
    const post = await this.repository.findByIdRaw(id);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài viết");
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

  async toggleSave(id: string, userId: string): Promise<{ saved: boolean }> {
    const post = await this.repository.findByIdRaw(id);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài viết");
    }
    const saved = await this.repository.toggleSave(id, userId);
    return { saved };
  }

  async listSaved(userId: string): Promise<PostDto[]> {
    const posts = await this.repository.findSaved(userId);
    return posts.map(toPostDto);
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
