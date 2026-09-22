import { AppointmentService } from "./appointment.service";
import { AppointmentRepository, type AppointmentWithRelations } from "./appointment.repository";
import { PetRepository } from "../pets/pet.repository";
import { ServiceRepository } from "../services/service.repository";
import { VetRepository, type VetWithUser } from "../vets/vet.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { NotificationService } from "../notifications/notification.service";
import { PetEventService } from "../pet-events/pet-event.service";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { ShopStatus } from "@petcare/types";
import type { Hospital, Pet, Service } from "@prisma/client";

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
    description: null,
    logo: null,
    cover: null,
    address: null,
    lat: null,
    lng: null,
    phone: null,
    email: null,
    status: ShopStatus.ACTIVE,
    isEmergency: false,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    ...overrides,
  } as Service;
}

function makeVet(overrides: Partial<VetWithUser> = {}): VetWithUser {
  return {
    id: "vet-1",
    hospitalId: "hospital-1",
    userId: "vet-user-1",
    specialty: null,
    experience: null,
    licenseNumber: null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: "vet-user-1", name: "BS. Minh", email: "vet@example.com" } as never,
    ...overrides,
  } as VetWithUser;
}

function makeAppointment(overrides: Partial<AppointmentWithRelations> = {}): AppointmentWithRelations {
  return {
    id: "appt-1",
    petId: "pet-1",
    userId: "owner-1",
    hospitalId: "hospital-1",
    serviceId: "service-1",
    vetId: null,
    dateTime: new Date(Date.now() + 60 * 60 * 1000),
    notes: null,
    status: "PENDING",
    createdAt: new Date(),
    pet: makePet(),
    service: makeService(),
    hospital: makeHospital(),
    vet: null,
    ...overrides,
  } as AppointmentWithRelations;
}

function setup() {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findManyByPetOwner: jest.fn(),
    findManyByHospital: jest.fn(),
    findManyByVet: jest.fn(),
    findConflictForVet: jest.fn(),
    recordHistory: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<AppointmentRepository>;

  const petRepository = { findById: jest.fn() } as unknown as jest.Mocked<PetRepository>;
  const serviceRepository = { findById: jest.fn() } as unknown as jest.Mocked<ServiceRepository>;
  const vetRepository = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
  } as unknown as jest.Mocked<VetRepository>;
  const hospitalRepository = {
    findById: jest.fn(),
    findByOwnerId: jest.fn(),
  } as unknown as jest.Mocked<HospitalRepository>;
  const notificationService = { create: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
  const petEventService = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PetEventService>;

  const service = new AppointmentService(
    repository,
    petRepository,
    serviceRepository,
    vetRepository,
    hospitalRepository,
    notificationService,
    petEventService,
  );

  return { service, repository, petRepository, serviceRepository, vetRepository, hospitalRepository, notificationService, petEventService };
}

const validInput = {
  petId: "pet-1",
  hospitalId: "hospital-1",
  serviceId: "service-1",
  dateTime: new Date(Date.now() + 60 * 60 * 1000),
} as const;

describe("AppointmentService.create", () => {
  it("creates an appointment, notifies the hospital owner, and publishes a PetEvent", async () => {
    const { service, repository, petRepository, serviceRepository, hospitalRepository, notificationService, petEventService } =
      setup();
    petRepository.findById.mockResolvedValue(makePet());
    hospitalRepository.findById.mockResolvedValue(makeHospital());
    serviceRepository.findById.mockResolvedValue(makeService());
    repository.create.mockResolvedValue(makeAppointment());

    await service.create("owner-1", { ...validInput });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ status: "PENDING" }));
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "hospital-owner-1", type: "APPOINTMENT" }),
    );
    expect(petEventService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ petId: "pet-1", eventType: "APPOINTMENT", referenceId: "appt-1" }),
    );
  });

  it("rejects booking a pet that isn't the requester's own", async () => {
    const { service, petRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet({ ownerId: "someone-else" }));

    await expect(service.create("owner-1", { ...validInput })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects booking at a hospital that doesn't exist or isn't active", async () => {
    const { service, petRepository, hospitalRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    hospitalRepository.findById.mockResolvedValue(makeHospital({ status: "PENDING" }));

    await expect(service.create("owner-1", { ...validInput })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a service that belongs to a different hospital", async () => {
    const { service, petRepository, hospitalRepository, serviceRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    hospitalRepository.findById.mockResolvedValue(makeHospital());
    serviceRepository.findById.mockResolvedValue(makeService({ hospitalId: "another-hospital" }));

    await expect(service.create("owner-1", { ...validInput })).rejects.toBeInstanceOf(BadRequestError);
  });

  it("checks for a conflict only when a specific vet is requested", async () => {
    const { service, repository, petRepository, hospitalRepository, serviceRepository, vetRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    hospitalRepository.findById.mockResolvedValue(makeHospital());
    serviceRepository.findById.mockResolvedValue(makeService());
    vetRepository.findById.mockResolvedValue(makeVet());
    repository.findConflictForVet.mockResolvedValue(makeAppointment());

    await expect(service.create("owner-1", { ...validInput, vetId: "vet-1" })).rejects.toBeInstanceOf(ConflictError);
    expect(repository.findConflictForVet).toHaveBeenCalledWith("vet-1", validInput.dateTime);
  });

  it("does not check for a conflict when no vet is requested", async () => {
    const { service, repository, petRepository, hospitalRepository, serviceRepository } = setup();
    petRepository.findById.mockResolvedValue(makePet());
    hospitalRepository.findById.mockResolvedValue(makeHospital());
    serviceRepository.findById.mockResolvedValue(makeService());
    repository.create.mockResolvedValue(makeAppointment());

    await service.create("owner-1", { ...validInput });

    expect(repository.findConflictForVet).not.toHaveBeenCalled();
  });
});

describe("AppointmentService.updateStatus", () => {
  it("allows a valid transition and notifies the pet owner", async () => {
    const { service, repository, hospitalRepository, notificationService } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(makeAppointment({ status: "PENDING" }));
    repository.updateStatus.mockResolvedValue(makeAppointment({ status: "CONFIRMED" }));

    await service.updateStatus("hospital-owner-1", "appt-1", "CONFIRMED");

    expect(repository.updateStatus).toHaveBeenCalledWith("appt-1", "CONFIRMED", "hospital-owner-1", undefined);
    expect(notificationService.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "owner-1" }));
  });

  it("rejects an invalid transition (e.g. COMPLETED -> CONFIRMED)", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital());
    repository.findById.mockResolvedValue(makeAppointment({ status: "COMPLETED" }));

    await expect(service.updateStatus("hospital-owner-1", "appt-1", "CONFIRMED")).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects a hospital acting on another hospital's appointment", async () => {
    const { service, repository, hospitalRepository } = setup();
    hospitalRepository.findByOwnerId.mockResolvedValue(makeHospital({ id: "another-hospital" }));
    repository.findById.mockResolvedValue(makeAppointment());

    await expect(service.updateStatus("hospital-owner-1", "appt-1", "CONFIRMED")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe("AppointmentService.cancelMine", () => {
  it("lets the pet owner cancel their own pending appointment", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeAppointment({ status: "PENDING" }));
    repository.updateStatus.mockResolvedValue(makeAppointment({ status: "CANCELLED" }));

    const result = await service.cancelMine("owner-1", "appt-1");

    expect(result.status).toBe("CANCELLED");
  });

  it("rejects cancelling someone else's appointment", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeAppointment({ userId: "someone-else" }));

    await expect(service.cancelMine("owner-1", "appt-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects cancelling an already-completed appointment", async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue(makeAppointment({ status: "COMPLETED" }));

    await expect(service.cancelMine("owner-1", "appt-1")).rejects.toBeInstanceOf(ConflictError);
  });
});
