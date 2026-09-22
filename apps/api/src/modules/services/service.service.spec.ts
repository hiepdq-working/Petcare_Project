import { ServiceService } from "./service.service";
import { ServiceRepository } from "./service.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { ShopStatus } from "@petcare/types";
import type { Hospital, Service } from "@prisma/client";

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
    phone: null,
    email: null,
    status: ShopStatus.ACTIVE,
    isEmergency: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  } as Hospital;
}

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: "service-1",
    providerType: "HOSPITAL",
    shopId: null,
    hospitalId: "hospital-1",
    name: "Kham tong quat",
    description: null,
    price: null,
    duration: null,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  } as Service;
}

function setup() {
  const repository = {
    create: jest.fn(),
    findManyByHospital: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<ServiceRepository>;

  const hospitalRepository = {
    findByOwnerId: jest.fn(),
  } as unknown as jest.Mocked<HospitalRepository>;

  const service = new ServiceService(repository, hospitalRepository);
  return { service, repository, hospitalRepository };
}

describe("ServiceService.create", () => {
  it("creates a service under the requester's own hospital", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.create.mockResolvedValue(makeService());

    await service.create("owner-1", { name: "Kham tong quat" });

    expect(repository.create).toHaveBeenCalledWith("hospital-1", { name: "Kham tong quat" });
  });

  it("raises NotFoundError when the account owns no hospital", async () => {
    const { service, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(null);

    await expect(service.create("owner-1", { name: "Kham tong quat" })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ServiceService ownership checks", () => {
  it("rejects updating a service that belongs to a different hospital", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(makeService({ hospitalId: "someone-elses-hospital" }));

    await expect(service.update("owner-1", "service-1", { name: "New name" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rejects deleting a service that belongs to a different hospital", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(makeService({ hospitalId: "someone-elses-hospital" }));

    await expect(service.remove("owner-1", "service-1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("allows updating a service owned by the requester's own hospital", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(makeService());
    repository.update.mockResolvedValue(makeService({ name: "Tiem phong" }));

    const updated = await service.update("owner-1", "service-1", { name: "Tiem phong" });

    expect(updated.name).toBe("Tiem phong");
  });

  it("raises NotFoundError for a service that doesn't exist", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(null);

    await expect(service.remove("owner-1", "missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
