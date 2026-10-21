import { UserRole } from "@petcare/types";
import type { Hospital, Pet, Post, PostComment } from "@prisma/client";
import { PostService } from "./post.service";
import { PostRepository, type PostWithRelations } from "./post.repository";
import { PetRepository } from "../pets/pet.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { VetRepository, type VetWithUser } from "../vets/vet.repository";
import { PetEventService } from "../pet-events/pet-event.service";
import { FavoriteRepository } from "../favorites/favorite.repository";
import { NotificationService } from "../notifications/notification.service";
import { GroupRepository } from "../groups/group.repository";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: "pet-1",
    ownerId: "owner-1",
    name: "Milo",
    species: "Chó",
    breed: null,
    birthDate: null,
    weight: null,
    avatar: null,
    notes: null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Pet;
}

function makeHospital(overrides: Partial<Hospital> = {}): Hospital {
  return {
    id: "hospital-1",
    ownerId: "hospital-owner-1",
    name: "Happy Paws",
    lat: null,
    lng: null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Hospital;
}

function makeVet(overrides: Partial<VetWithUser> = {}): VetWithUser {
  return {
    id: "vet-1",
    hospitalId: "hospital-1",
    userId: "vet-user-1",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: "vet-user-1", name: "BS. Minh" } as never,
    ...overrides,
  } as VetWithUser;
}

function makePost(overrides: Partial<PostWithRelations> = {}): PostWithRelations {
  return {
    id: "post-1",
    userId: "owner-1",
    petId: null,
    hospitalId: null,
    vetId: null,
    content: "Xin chào",
    createdAt: new Date(),
    user: { id: "owner-1", name: "Chủ nuôi", avatar: null },
    pet: null,
    hospital: null,
    vet: null,
    media: [],
    likes: [],
    savedBy: [],
    groupId: null,
    group: null,
    kind: "NORMAL",
    promoTitle: null,
    discountText: null,
    promoStartsAt: null,
    promoEndsAt: null,
    _count: { likes: 0, comments: 0 },
    ...overrides,
  } as unknown as PostWithRelations;
}

function makePostRaw(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-1",
    userId: "owner-1",
    petId: null,
    content: "Xin chào",
    createdAt: new Date(),
    ...overrides,
  } as Post;
}

function makeComment(overrides: Partial<PostComment> = {}): PostComment {
  return {
    id: "comment-1",
    postId: "post-1",
    userId: "owner-1",
    parentId: null,
    content: "Đáng yêu quá",
    createdAt: new Date(),
    ...overrides,
  } as PostComment;
}

function setup() {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdRaw: jest.fn(),
    findMany: jest.fn(),
    findManyByPet: jest.fn(),
    delete: jest.fn(),
    toggleLike: jest.fn(),
    createComment: jest.fn(),
    findCommentsByPost: jest.fn(),
    findCommentById: jest.fn(),
    deleteComment: jest.fn(),
  } as unknown as jest.Mocked<PostRepository>;

  const petRepository = { findById: jest.fn() } as unknown as jest.Mocked<PetRepository>;
  const hospitalRepository = { findByOwnerId: jest.fn() } as unknown as jest.Mocked<HospitalRepository>;
  const vetRepository = { findById: jest.fn() } as unknown as jest.Mocked<VetRepository>;
  const petEventService = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PetEventService>;

  const favoriteRepository = { findFollowerIds: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<FavoriteRepository>;
  const notificationService = { create: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
  const groupRepository = { findByIdRaw: jest.fn(), isMember: jest.fn() } as unknown as jest.Mocked<GroupRepository>;

  const service = new PostService(
    repository,
    petRepository,
    hospitalRepository,
    vetRepository,
    petEventService,
    favoriteRepository,
    notificationService,
    groupRepository,
  );

  return {
    service,
    repository,
    petRepository,
    hospitalRepository,
    vetRepository,
    petEventService,
    favoriteRepository,
    notificationService,
    groupRepository,
  };
}

describe("PostService.create — Pet Owner", () => {
  it("creates a post with no pet tag and does not publish a PetEvent", async () => {
    const { service, repository, petEventService } = setup();
    repository.create.mockResolvedValue(makePost());

    await service.create("owner-1", UserRole.PET_OWNER, { kind: "NORMAL" as const, content: "Xin chào" });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "owner-1", content: "Xin chào", hospitalId: undefined }),
      "owner-1",
    );
    expect(petEventService.publish).not.toHaveBeenCalled();
  });

  it("publishes a SOCIAL_POST PetEvent when the post is tagged to a pet", async () => {
    const { service, repository, petRepository, petEventService } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    repository.create.mockResolvedValue(makePost({ petId: "pet-1" }));

    await service.create("owner-1", UserRole.PET_OWNER, { kind: "NORMAL" as const, content: "Ảnh dễ thương", petId: "pet-1" });

    expect(petEventService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ petId: "pet-1", eventType: "SOCIAL_POST", referenceId: "post-1" }),
    );
  });

  it("rejects tagging a pet that isn't the requester's own", async () => {
    const { service, petRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet({ ownerId: "someone-else" }));

    await expect(
      service.create("owner-1", UserRole.PET_OWNER, { kind: "NORMAL" as const, content: "x", petId: "pet-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects more than 1 photo", async () => {
    const { service } = setup();

    await expect(
      service.create("owner-1", UserRole.PET_OWNER, { kind: "NORMAL" as const,
        content: "x",
        media: [
          { mediaUrl: "https://x.test/a.png", mediaType: "image" },
          { mediaUrl: "https://x.test/b.png", mediaType: "image" },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects tagging a vet — only a Hospital may do that", async () => {
    const { service } = setup();

    await expect(
      service.create("owner-1", UserRole.PET_OWNER, { kind: "NORMAL" as const, content: "x", vetId: "vet-1" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe("PostService.create — Hospital", () => {
  it("auto-attaches the caller's own hospital and allows up to 5 photos", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.create.mockResolvedValue(makePost({ hospitalId: "hospital-1" }));

    const media = Array.from({ length: 5 }, (_, i) => ({ mediaUrl: `https://x.test/${i}.png`, mediaType: "image" as const }));
    await service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { kind: "NORMAL" as const, content: "Phòng khám của chúng tôi", media });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ hospitalId: "hospital-1", petId: undefined }),
      "hospital-owner-1",
    );
  });

  it("validates a tagged vet belongs to the caller's own hospital", async () => {
    const { service, hospitalRepository, vetRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    vetRepository.findById.mockResolvedValue(makeVet({ hospitalId: "another-hospital" }));

    await expect(
      service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { kind: "NORMAL" as const, content: "x", vetId: "vet-1" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects tagging a pet — that's a Pet Owner concept", async () => {
    const { service, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());

    await expect(
      service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { kind: "NORMAL" as const, content: "x", petId: "pet-1" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("raises NotFoundError when the caller has no hospital", async () => {
    const { service, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(null);

    await expect(
      service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { kind: "NORMAL" as const, content: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("PostService.listFeed", () => {
  it("passes paging options to the repository", async () => {
    const { service, repository } = setup();
    repository.findMany.mockResolvedValue([makePost()]);
    const before = new Date("2026-10-01T00:00:00Z");

    const posts = await service.listFeed("owner-1", { limit: 10, before });

    expect(repository.findMany).toHaveBeenCalledWith("owner-1", 10, before);
    expect(posts).toHaveLength(1);
  });

  it("defaults to the repository's own page size when no options are given", async () => {
    const { service, repository } = setup();
    repository.findMany.mockResolvedValue([]);

    await service.listFeed("owner-1");

    expect(repository.findMany).toHaveBeenCalledWith("owner-1", undefined, undefined);
  });
});

describe("PostService.create — groups", () => {
  it("lets a member post inside a group", async () => {
    const { service, repository, groupRepository } = setup();
    groupRepository.findByIdRaw.mockResolvedValue({ id: "group-1" } as never);
    groupRepository.isMember.mockResolvedValue(true);
    repository.create.mockResolvedValue(makePost());

    await service.create("owner-1", UserRole.PET_OWNER, { kind: "NORMAL", content: "Chào cả nhóm", groupId: "group-1" });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ groupId: "group-1" }), "owner-1");
  });

  it("rejects posting in a group the user hasn't joined", async () => {
    const { service, repository, groupRepository } = setup();
    groupRepository.findByIdRaw.mockResolvedValue({ id: "group-1" } as never);
    groupRepository.isMember.mockResolvedValue(false);

    await expect(
      service.create("owner-1", UserRole.PET_OWNER, { kind: "NORMAL", content: "x", groupId: "group-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("raises NotFoundError for a group that doesn't exist", async () => {
    const { service, groupRepository } = setup();
    groupRepository.findByIdRaw.mockResolvedValue(null);

    await expect(
      service.create("owner-1", UserRole.PET_OWNER, { kind: "NORMAL", content: "x", groupId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a hospital posting in a group", async () => {
    const { service } = setup();

    await expect(
      service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { kind: "NORMAL", content: "x", groupId: "group-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("PostService.create — promotions", () => {
  const promo = {
    kind: "PROMOTION" as const,
    content: "Giảm giá tiêm phòng",
    promoTitle: "Tiêm phòng -20%",
    promoEndsAt: new Date(Date.now() + 86_400_000),
  };

  it("notifies everyone who favorited the clinic", async () => {
    const { service, repository, hospitalRepository, favoriteRepository, notificationService } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.create.mockResolvedValue(makePost({ hospitalId: "hospital-1" }));
    favoriteRepository.findFollowerIds.mockResolvedValue(["fan-1", "fan-2"]);

    await service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, promo);

    expect(favoriteRepository.findFollowerIds).toHaveBeenCalledWith("hospital-1");
    expect(notificationService.create).toHaveBeenCalledTimes(2);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "fan-1", type: "PROMOTION" }),
    );
  });

  it("does not notify anyone for a normal hospital post", async () => {
    const { service, repository, hospitalRepository, notificationService } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.create.mockResolvedValue(makePost({ hospitalId: "hospital-1" }));

    await service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { kind: "NORMAL", content: "Xin chào" });

    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it("rejects a Pet Owner posting a promotion", async () => {
    const { service } = setup();

    await expect(service.create("owner-1", UserRole.PET_OWNER, promo)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("PostService.remove", () => {
  it("lets the author delete their own post", async () => {
    const { service, repository } = setup();
    repository.findByIdRaw.mockResolvedValue(makePostRaw());

    await service.remove("post-1", "owner-1");

    expect(repository.delete).toHaveBeenCalledWith("post-1");
  });

  it("rejects deleting someone else's post", async () => {
    const { service, repository } = setup();
    repository.findByIdRaw.mockResolvedValue(makePostRaw({ userId: "someone-else" }));

    await expect(service.remove("post-1", "owner-1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("raises NotFoundError for a post that doesn't exist", async () => {
    const { service, repository } = setup();
    repository.findByIdRaw.mockResolvedValue(null);

    await expect(service.remove("missing", "owner-1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("PostService.addComment", () => {
  it("adds a top-level comment", async () => {
    const { service, repository } = setup();
    repository.findByIdRaw.mockResolvedValue(makePostRaw());
    repository.createComment.mockResolvedValue({ ...makeComment(), user: { id: "owner-1", name: "Chủ nuôi" } } as never);

    await service.addComment("post-1", "owner-1", { content: "Đáng yêu quá" });

    expect(repository.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ postId: "post-1", content: "Đáng yêu quá" }),
    );
  });

  it("rejects a reply whose parentId belongs to a different post", async () => {
    const { service, repository } = setup();
    repository.findByIdRaw.mockResolvedValue(makePostRaw());
    repository.findCommentById.mockResolvedValue(makeComment({ postId: "another-post" }));

    await expect(
      service.addComment("post-1", "owner-1", { content: "x", parentId: "comment-1" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe("PostService.removeComment", () => {
  it("lets the comment's author delete it", async () => {
    const { service, repository } = setup();
    repository.findCommentById.mockResolvedValue(makeComment());

    await service.removeComment("post-1", "comment-1", "owner-1");

    expect(repository.deleteComment).toHaveBeenCalledWith("comment-1");
  });

  it("rejects deleting someone else's comment", async () => {
    const { service, repository } = setup();
    repository.findCommentById.mockResolvedValue(makeComment({ userId: "someone-else" }));

    await expect(service.removeComment("post-1", "comment-1", "owner-1")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("PostService.toggleLike", () => {
  it("returns liked: true when a like is created", async () => {
    const { service, repository } = setup();
    repository.findByIdRaw.mockResolvedValue(makePostRaw());
    repository.toggleLike.mockResolvedValue(true);

    const result = await service.toggleLike("post-1", "owner-1");

    expect(result).toEqual({ liked: true });
  });
});
