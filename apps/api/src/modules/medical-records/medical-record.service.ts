import { Injectable } from "@nestjs/common";
import { UserRole, type MedicalRecordDto } from "@petcare/types";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { PetEventService } from "../pet-events/pet-event.service";
import { PetRepository } from "../pets/pet.repository";
import { VetRepository, type VetWithUser } from "../vets/vet.repository";
import { MedicalRecordRepository, type MedicalRecordWithRelations } from "./medical-record.repository";
import { toMedicalRecordDto } from "./medical-record.types";
import type { AddMedicalFileInput, AddMedicalRecordVersionInput, CreateMedicalRecordInput } from "./medical-record.validator";

function summarize(content: { diagnosis?: string; conclusion?: string }): string {
  return content.diagnosis ?? content.conclusion ?? "Đã cập nhật hồ sơ khám bệnh";
}

@Injectable()
export class MedicalRecordService {
  constructor(
    private readonly repository: MedicalRecordRepository,
    private readonly petRepository: PetRepository,
    private readonly vetRepository: VetRepository,
    private readonly petEventService: PetEventService,
  ) {}

  private async resolveVet(userId: string): Promise<VetWithUser> {
    const vet = await this.vetRepository.findByUserId(userId);
    if (!vet) {
      throw new NotFoundError("Không tìm thấy hồ sơ bác sĩ");
    }
    return vet;
  }

  private assertVetOwnsRecord(record: MedicalRecordWithRelations, vet: VetWithUser): void {
    if (record.hospitalId !== vet.hospitalId) {
      throw new ForbiddenError("Hồ sơ bệnh án này không thuộc phòng khám của bạn");
    }
  }

  async create(userId: string, input: CreateMedicalRecordInput): Promise<MedicalRecordDto> {
    const vet = await this.resolveVet(userId);
    const pet = await this.petRepository.findById(input.petId);
    if (!pet) {
      throw new NotFoundError("Không tìm thấy thú cưng");
    }
    const treated = await this.repository.hasHospitalTreatedPet(vet.hospitalId, input.petId);
    if (!treated) {
      throw new ForbiddenError("Phòng khám của bạn chưa từng khám cho thú cưng này");
    }

    const { petId, recordDate, ...content } = input;
    const record = await this.repository.create({
      petId,
      vetId: vet.id,
      hospitalId: vet.hospitalId,
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      editedById: userId,
      content,
    });

    // One timeline entry per real-world visit — later edits (addVersion)
    // refine this same record rather than publishing a second event.
    await this.petEventService.publish({
      petId,
      eventType: "MEDICAL",
      eventDate: record.recordDate,
      referenceType: "MedicalRecord",
      referenceId: record.id,
      payload: { title: "Hồ sơ bệnh án mới", summary: summarize(content) },
      createdById: userId,
    });

    return toMedicalRecordDto(record);
  }

  async listByPet(petId: string, requesterId: string): Promise<MedicalRecordDto[]> {
    const pet = await this.petRepository.findById(petId);
    if (!pet) {
      throw new NotFoundError("Không tìm thấy thú cưng");
    }
    if (pet.ownerId !== requesterId) {
      throw new ForbiddenError("Bạn không có quyền truy cập thú cưng này");
    }
    const records = await this.repository.findManyByPet(petId);
    return records.map(toMedicalRecordDto);
  }

  async listMine(userId: string): Promise<MedicalRecordDto[]> {
    const vet = await this.resolveVet(userId);
    const records = await this.repository.findManyByVet(vet.id);
    return records.map(toMedicalRecordDto);
  }

  async getOne(id: string, requesterId: string, role: UserRole): Promise<MedicalRecordDto> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundError("Không tìm thấy hồ sơ bệnh án");
    }

    if (role === UserRole.PET_OWNER) {
      if (record.pet.ownerId !== requesterId) {
        throw new ForbiddenError("Bạn không có quyền truy cập hồ sơ bệnh án này");
      }
    } else if (role === UserRole.VET) {
      const vet = await this.resolveVet(requesterId);
      this.assertVetOwnsRecord(record, vet);
    } else {
      throw new ForbiddenError();
    }

    return toMedicalRecordDto(record);
  }

  async addVersion(id: string, userId: string, input: AddMedicalRecordVersionInput): Promise<MedicalRecordDto> {
    const vet = await this.resolveVet(userId);
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundError("Không tìm thấy hồ sơ bệnh án");
    }
    this.assertVetOwnsRecord(record, vet);

    const updated = await this.repository.addVersion(id, userId, input);
    return toMedicalRecordDto(updated);
  }

  async addFile(id: string, userId: string, input: AddMedicalFileInput): Promise<MedicalRecordDto> {
    const vet = await this.resolveVet(userId);
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundError("Không tìm thấy hồ sơ bệnh án");
    }
    this.assertVetOwnsRecord(record, vet);

    const updated = await this.repository.addFile(id, input);
    return toMedicalRecordDto(updated);
  }
}
