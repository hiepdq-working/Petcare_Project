import { HospitalService } from "./hospital.service";
import { HospitalRepository } from "./hospital.repository";
import { NotFoundError } from "../../common/errors/app-error";
import { ShopStatus } from "@petcare/types";
import type { Hospital } from "@prisma/client";

function makeHospital(overrides: Partial<Hospital> = {}): Hospital {
  return {
    id: "hospital-1",
    ownerId: "owner-1",
    name: "Happy Paws",
    description: null,
    logo: null,
    cover: null,
    address: "123 Nguyen Trai",
    lat: null,
    lng: null,
    phone: "0900000000",
    email: "clinic@example.com",
    status: ShopStatus.ACTIVE,
    isEmergency: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  } as Hospital;
}

function setup() {
  const repository = {
    findByOwnerId: jest.fn(),
    update: jest.fn(),
    findNearby: jest.fn(),
  } as unknown as jest.Mocked<HospitalRepository>;

  const service = new HospitalService(repository);
  return { service, repository };
}

describe("HospitalService.getMine", () => {
  it("returns the hospital owned by the requester", async () => {
    const { service, repository } = setup();
    repository.findByOwnerId.mockResolvedValue(makeHospital());

    const hospital = await service.getMine("owner-1");

    expect(hospital.id).toBe("hospital-1");
    expect(repository.findByOwnerId).toHaveBeenCalledWith("owner-1");
  });

  it("raises NotFoundError when the account owns no hospital", async () => {
    const { service, repository } = setup();
    repository.findByOwnerId.mockResolvedValue(null);

    await expect(service.getMine("owner-1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("HospitalService.updateMine", () => {
  it("updates only the owner's own hospital, by its id", async () => {
    const { service, repository } = setup();
    repository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.update.mockResolvedValue(makeHospital({ lat: 10.77, lng: 106.7 }));

    const hospital = await service.updateMine("owner-1", { lat: 10.77, lng: 106.7 });

    expect(repository.update).toHaveBeenCalledWith("hospital-1", { lat: 10.77, lng: 106.7 });
    expect(hospital.lat).toBe(10.77);
  });

  it("raises NotFoundError when the account owns no hospital", async () => {
    const { service, repository } = setup();
    repository.findByOwnerId.mockResolvedValue(null);

    await expect(service.updateMine("owner-1", { name: "New name" })).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe("HospitalService.searchNearby", () => {
  it("converts radiusKm to meters for the query and distance back to km, rounded to 1 decimal", async () => {
    const { service, repository } = setup();
    repository.findNearby.mockResolvedValue([
      {
        id: "hospital-1",
        name: "Happy Paws",
        description: null,
        logo: null,
        cover: null,
        address: "123 Nguyen Trai",
        lat: 10.75,
        lng: 106.66,
        phone: "0900000000",
        isEmergency: false,
        distanceMeters: 2345,
      },
    ]);

    const results = await service.searchNearby({ lat: 10.75, lng: 106.66, radiusKm: 5, limit: 20 });

    expect(repository.findNearby).toHaveBeenCalledWith(10.75, 106.66, 5000, 20);
    expect(results).toHaveLength(1);
    expect(results.at(0)?.distanceKm).toBe(2.3);
  });

  it("returns an empty array when nothing is within range", async () => {
    const { service, repository } = setup();
    repository.findNearby.mockResolvedValue([]);

    const results = await service.searchNearby({ lat: 0, lng: 0, radiusKm: 10, limit: 20 });

    expect(results).toEqual([]);
  });
});
