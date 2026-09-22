import type { Hospital, Review, User } from "@prisma/client";
import { ReviewService } from "./review.service";
import { ReviewRepository, type ReviewWithUser } from "./review.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { ConflictError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";

function makeHospital(overrides: Partial<Hospital> = {}): Hospital {
  return {
    id: "hospital-1",
    ownerId: "hospital-owner-1",
    name: "Happy Paws",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Hospital;
}

function makeReview(overrides: Partial<ReviewWithUser> = {}): ReviewWithUser {
  return {
    id: "review-1",
    userId: "owner-1",
    providerType: "HOSPITAL",
    providerId: "hospital-1",
    rating: 5,
    comment: "Rất tốt",
    createdAt: new Date(),
    user: { id: "owner-1", name: "Chủ nuôi", avatar: null } as User,
    ...overrides,
  } as ReviewWithUser;
}

function setup() {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserAndHospital: jest.fn(),
    findManyByHospital: jest.fn(),
    findManyByUser: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    hasCompletedAppointment: jest.fn(),
  } as unknown as jest.Mocked<ReviewRepository>;

  const hospitalRepository = { findById: jest.fn() } as unknown as jest.Mocked<HospitalRepository>;

  const service = new ReviewService(repository, hospitalRepository);

  return { service, repository, hospitalRepository };
}

describe("ReviewService.create", () => {
  it("creates a review when the pet owner has a completed appointment there", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findById.mockResolvedValue(makeHospital());
    repository.hasCompletedAppointment.mockResolvedValue(true);
    repository.findByUserAndHospital.mockResolvedValue(null);
    repository.create.mockResolvedValue(makeReview());

    await service.create("owner-1", { hospitalId: "hospital-1", rating: 5, comment: "Rất tốt" });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "owner-1", hospitalId: "hospital-1", rating: 5 }),
    );
  });

  it("rejects a reviewer who never completed an appointment there", async () => {
    const { service, hospitalRepository, repository } = setup();
    hospitalRepository.findById.mockResolvedValue(makeHospital());
    repository.hasCompletedAppointment.mockResolvedValue(false);

    await expect(service.create("owner-1", { hospitalId: "hospital-1", rating: 5 })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rejects a second review from the same reviewer for the same hospital", async () => {
    const { service, hospitalRepository, repository } = setup();
    hospitalRepository.findById.mockResolvedValue(makeHospital());
    repository.hasCompletedAppointment.mockResolvedValue(true);
    repository.findByUserAndHospital.mockResolvedValue(makeReview() as unknown as Review);

    await expect(service.create("owner-1", { hospitalId: "hospital-1", rating: 4 })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("raises NotFoundError for a hospital that doesn't exist", async () => {
    const { service, hospitalRepository } = setup();
    hospitalRepository.findById.mockResolvedValue(null);

    await expect(service.create("owner-1", { hospitalId: "missing", rating: 5 })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("ReviewService.update", () => {
  it("lets the author update their own review", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeReview());
    repository.update.mockResolvedValue(makeReview({ rating: 3 }));

    await service.update("review-1", "owner-1", { rating: 3 });

    expect(repository.update).toHaveBeenCalledWith("review-1", { rating: 3 });
  });

  it("rejects updating someone else's review", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeReview({ userId: "someone-else" }));

    await expect(service.update("review-1", "owner-1", { rating: 3 })).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("ReviewService.remove", () => {
  it("lets the author delete their own review", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeReview());

    await service.remove("review-1", "owner-1");

    expect(repository.delete).toHaveBeenCalledWith("review-1");
  });

  it("rejects deleting someone else's review", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeReview({ userId: "someone-else" }));

    await expect(service.remove("review-1", "owner-1")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("ReviewService.listByHospital", () => {
  it("computes the average rating rounded to 1 decimal", async () => {
    const { service, repository } = setup();
    repository.findManyByHospital.mockResolvedValue([
      makeReview({ rating: 5 }),
      makeReview({ rating: 4 }),
      makeReview({ rating: 4 }),
    ]);

    const summary = await service.listByHospital("hospital-1");

    expect(summary.totalCount).toBe(3);
    expect(summary.averageRating).toBeCloseTo(4.3, 1);
  });

  it("returns a 0 average with no reviews", async () => {
    const { service, repository } = setup();
    repository.findManyByHospital.mockResolvedValue([]);

    const summary = await service.listByHospital("hospital-1");

    expect(summary.averageRating).toBe(0);
    expect(summary.totalCount).toBe(0);
  });
});
