import { UserRole } from "@petcare/types";
import type { Hospital } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { assertStaffPosition, findHospitalForActor } from "./hospital-access";
import type { HospitalRepository } from "./hospital.repository";

const hospital = { id: "h-1", ownerId: "owner-1" } as Hospital;

function makeRepository() {
  return {
    findByOwnerId: jest.fn(),
    findByStaffUserId: jest.fn(),
    findStaffByUserId: jest.fn(),
  } as unknown as jest.Mocked<HospitalRepository>;
}

describe("findHospitalForActor", () => {
  it("resolves a hospital owner through ownerId", async () => {
    const repository = makeRepository();
    repository.findByOwnerId.mockResolvedValue(hospital);

    await expect(findHospitalForActor(repository, "owner-1", UserRole.HOSPITAL_OWNER)).resolves.toBe(hospital);
    expect(repository.findByStaffUserId).not.toHaveBeenCalled();
  });

  it("resolves staff through their active HospitalStaff row", async () => {
    const repository = makeRepository();
    repository.findByStaffUserId.mockResolvedValue(hospital);

    await expect(findHospitalForActor(repository, "staff-1", UserRole.HOSPITAL_STAFF)).resolves.toBe(hospital);
    expect(repository.findByOwnerId).not.toHaveBeenCalled();
  });

  it("raises NotFoundError for a deactivated staff member", async () => {
    const repository = makeRepository();
    repository.findByStaffUserId.mockResolvedValue(null);

    await expect(findHospitalForActor(repository, "staff-1", UserRole.HOSPITAL_STAFF)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("assertStaffPosition", () => {
  it("allows an active staff member in an allowed position", async () => {
    const repository = makeRepository();
    repository.findStaffByUserId.mockResolvedValue({ position: "NURSE", status: "ACTIVE" } as never);

    await expect(assertStaffPosition(repository, "staff-1", ["NURSE"], "no")).resolves.toBeUndefined();
  });

  it.each([
    ["wrong position", { position: "RECEPTIONIST", status: "ACTIVE" }],
    ["inactive staff", { position: "NURSE", status: "INACTIVE" }],
    ["no staff row", null],
  ])("rejects %s", async (_label, row) => {
    const repository = makeRepository();
    repository.findStaffByUserId.mockResolvedValue(row as never);

    await expect(assertStaffPosition(repository, "staff-1", ["NURSE"], "no")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
