import { Injectable } from "@nestjs/common";
import { UserRole, type VaccinationDto } from "@petcare/types";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { PetEventService } from "../pet-events/pet-event.service";
import { PetRepository } from "../pets/pet.repository";
import { VetRepository } from "../vets/vet.repository";
import { VaccinationRepository } from "./vaccination.repository";
import { toVaccinationDto } from "./vaccination.types";
import type { CreateVaccinationInput } from "./vaccination.validator";

@Injectable()
export class VaccinationService {
  constructor(
    private readonly repository: VaccinationRepository,
    private readonly petRepository: PetRepository,
    private readonly vetRepository: VetRepository,
    private readonly petEventService: PetEventService,
  ) {}

  // Either the pet's own owner (self-reported) or a Vet whose hospital has
  // actually treated the pet may log a vaccination — the same trust
  // boundary as MedicalRecordService.create.
  private async assertCanWrite(petId: string, requesterId: string, role: UserRole): Promise<void> {
    const pet = await this.petRepository.findById(petId);
    if (!pet) {
      throw new NotFoundError("Không tìm thấy thú cưng");
    }

    if (role === UserRole.PET_OWNER) {
      if (pet.ownerId !== requesterId) {
        throw new ForbiddenError("Thú cưng này không thuộc tài khoản của bạn");
      }
      return;
    }

    if (role === UserRole.VET) {
      const vet = await this.vetRepository.findByUserId(requesterId);
      if (!vet) {
        throw new NotFoundError("Không tìm thấy hồ sơ bác sĩ");
      }
      const treated = await this.repository.hasHospitalTreatedPet(vet.hospitalId, petId);
      if (!treated) {
        throw new ForbiddenError("Phòng khám của bạn chưa từng khám cho thú cưng này");
      }
      return;
    }

    throw new ForbiddenError();
  }

  async create(requesterId: string, role: UserRole, input: CreateVaccinationInput): Promise<VaccinationDto> {
    await this.assertCanWrite(input.petId, requesterId, role);

    const vaccination = await this.repository.create({
      petId: input.petId,
      vaccineName: input.vaccineName,
      dateGiven: input.dateGiven,
      nextDueDate: input.nextDueDate,
      notes: input.notes,
      createdById: requesterId,
    });

    await this.petEventService.publish({
      petId: input.petId,
      eventType: "VACCINATION",
      eventDate: input.dateGiven,
      referenceType: "Vaccination",
      referenceId: vaccination.id,
      payload: { title: "Tiêm phòng", summary: input.vaccineName },
      createdById: requesterId,
    });

    return toVaccinationDto(vaccination);
  }

  async listByPet(petId: string, requesterId: string, role: UserRole): Promise<VaccinationDto[]> {
    const pet = await this.petRepository.findById(petId);
    if (!pet) {
      throw new NotFoundError("Không tìm thấy thú cưng");
    }

    if (role === UserRole.PET_OWNER) {
      if (pet.ownerId !== requesterId) {
        throw new ForbiddenError("Bạn không có quyền truy cập thú cưng này");
      }
    } else if (role === UserRole.VET) {
      const vet = await this.vetRepository.findByUserId(requesterId);
      if (!vet) {
        throw new NotFoundError("Không tìm thấy hồ sơ bác sĩ");
      }
      const treated = await this.repository.hasHospitalTreatedPet(vet.hospitalId, petId);
      if (!treated) {
        throw new ForbiddenError("Phòng khám của bạn chưa từng khám cho thú cưng này");
      }
    } else {
      throw new ForbiddenError();
    }

    const vaccinations = await this.repository.findManyByPet(petId);
    return vaccinations.map(toVaccinationDto);
  }
}
