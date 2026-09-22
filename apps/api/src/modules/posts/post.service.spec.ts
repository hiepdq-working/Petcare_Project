import { UserRole } from "@petcare/types";
import type { Hospital, Pet, Post, PostComment } from "@prisma/client";
import { PostService } from "./post.service";
import { PostRepository, type PostWithRelations } from "./post.repository";
import { PetRepository } from "../pets/pet.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { VetRepository, type VetWithUser } from "../vets/vet.repository";
import { PetEventService } from "../pet-events/pet-event.service";
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

  const service = new PostService(repository, petRepository, hospitalRepository, vetRepository, petEventService);

  return { service, repository, petRepository, hospitalRepository, vetRepository, petEventService };
}

describe("PostService.create — Pet Owner", () => {
  it("creates a post with no pet tag and does not publish a PetEvent", async () => {
    const { service, repository, petEventService } = setup();
    repository.create.mockResolvedValue(makePost());

    await service.create("owner-1", UserRole.PET_OWNER, { content: "Xin chào" });

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

    await service.create("owner-1", UserRole.PET_OWNER, { content: "Ảnh dễ thương", petId: "pet-1" });

    expect(petEventService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ petId: "pet-1", eventType: "SOCIAL_POST", referenceId: "post-1" }),
    );
  });

  it("rejects tagging a pet that isn't the requester's own", async () => {
    const { service, petRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet({ ownerId: "someone-else" }));

    await expect(
      service.create("owner-1", UserRole.PET_OWNER, { content: "x", petId: "pet-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects more than 1 photo", async () => {
    const { service } = setup();

    await expect(
      service.create("owner-1", UserRole.PET_OWNER, {
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
      service.create("owner-1", UserRole.PET_OWNER, { content: "x", vetId: "vet-1" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe("PostService.create — Hospital", () => {
  it("auto-attaches the caller's own hospital and allows up to 5 photos", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.create.mockResolvedValue(makePost({ hospitalId: "hospital-1" }));

    const media = Array.from({ length: 5 }, (_, i) => ({ mediaUrl: `https://x.test/${i}.png`, mediaType: "image" as const }));
    await service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { content: "Phòng khám của chúng tôi", media });

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
      service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { content: "x", vetId: "vet-1" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects tagging a pet — that's a Pet Owner concept", async () => {
    const { service, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());

    await expect(
      service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { content: "x", petId: "pet-1" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("raises NotFoundError when the caller has no hospital", async () => {
    const { service, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(null);

    await expect(
      service.create("hospital-owner-1", UserRole.HOSPITAL_OWNER, { content: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
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
