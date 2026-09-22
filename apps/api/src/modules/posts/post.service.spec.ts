import type { Pet, Post, PostComment } from "@prisma/client";
import { PostService } from "./post.service";
import { PostRepository, type PostWithRelations } from "./post.repository";
import { PetRepository } from "../pets/pet.repository";
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

function makePost(overrides: Partial<PostWithRelations> = {}): PostWithRelations {
  return {
    id: "post-1",
    userId: "owner-1",
    petId: null,
    content: "Xin chào",
    createdAt: new Date(),
    user: { id: "owner-1", name: "Chủ nuôi", avatar: null },
    pet: null,
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
  const petEventService = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PetEventService>;

  const service = new PostService(repository, petRepository, petEventService);

  return { service, repository, petRepository, petEventService };
}

describe("PostService.create", () => {
  it("creates a post with no pet tag and does not publish a PetEvent", async () => {
    const { service, repository, petEventService } = setup();
    repository.create.mockResolvedValue(makePost());

    await service.create("owner-1", { content: "Xin chào" });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "owner-1", content: "Xin chào" }),
      "owner-1",
    );
    expect(petEventService.publish).not.toHaveBeenCalled();
  });

  it("publishes a SOCIAL_POST PetEvent when the post is tagged to a pet", async () => {
    const { service, repository, petRepository, petEventService } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    repository.create.mockResolvedValue(makePost({ petId: "pet-1" }));

    await service.create("owner-1", { content: "Ảnh dễ thương", petId: "pet-1" });

    expect(petEventService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ petId: "pet-1", eventType: "SOCIAL_POST", referenceId: "post-1" }),
    );
  });

  it("rejects tagging a pet that isn't the requester's own", async () => {
    const { service, petRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet({ ownerId: "someone-else" }));

    await expect(service.create("owner-1", { content: "x", petId: "pet-1" })).rejects.toBeInstanceOf(ForbiddenError);
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
