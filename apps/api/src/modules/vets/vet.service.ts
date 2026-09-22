import { Injectable } from "@nestjs/common";
import type { VetDto, VetSummaryDto } from "@petcare/types";
import { ConflictError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { MailerService } from "../../lib/mailer.service";
import { generateOpaqueToken } from "../../lib/tokens";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { VetRepository, type VetWithUser } from "./vet.repository";
import { toVetDto, toVetSummaryDto } from "./vet.types";
import type { CreateVetInput, UpdateVetInput } from "./vet.validator";

const INVITE_TOKEN_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VetService {
  constructor(
    private readonly repository: VetRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly mailer: MailerService,
  ) {}

  private async resolveHospitalId(ownerId: string): Promise<{ id: string; name: string }> {
    const hospital = await this.hospitalRepository.findByOwnerId(ownerId);
    if (!hospital) {
      throw new NotFoundError("Không tìm thấy phòng khám của tài khoản này");
    }
    return { id: hospital.id, name: hospital.name };
  }

  private async findOwnedOrThrow(vetId: string, hospitalId: string): Promise<VetWithUser> {
    const vet = await this.repository.findById(vetId);
    if (!vet) {
      throw new NotFoundError("Không tìm thấy bác sĩ");
    }
    if (vet.hospitalId !== hospitalId) {
      throw new ForbiddenError("Bác sĩ này không thuộc phòng khám của bạn");
    }
    return vet;
  }

  async create(ownerId: string, input: CreateVetInput): Promise<VetDto> {
    const hospital = await this.resolveHospitalId(ownerId);

    const existingUser = await this.repository.findUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError("Email này đã có tài khoản trong hệ thống");
    }

    const passwordResetToken = generateOpaqueToken();
    const passwordResetExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * DAY_MS);

    const vet = await this.repository.create(hospital.id, {
      ...input,
      passwordResetToken,
      passwordResetExpiresAt,
    });

    const content = this.mailer.buildVetInvitedContent(vet.user.name, hospital.name, passwordResetToken);
    await this.mailer.send({ to: vet.user.email, ...content });

    return toVetDto(vet);
  }

  async listMine(ownerId: string): Promise<VetDto[]> {
    const hospital = await this.resolveHospitalId(ownerId);
    const vets = await this.repository.findManyByHospital(hospital.id);
    return vets.map(toVetDto);
  }

  async getOneMine(ownerId: string, vetId: string): Promise<VetDto> {
    const hospital = await this.resolveHospitalId(ownerId);
    const vet = await this.findOwnedOrThrow(vetId, hospital.id);
    return toVetDto(vet);
  }

  async update(ownerId: string, vetId: string, input: UpdateVetInput): Promise<VetDto> {
    const hospital = await this.resolveHospitalId(ownerId);
    await this.findOwnedOrThrow(vetId, hospital.id);
    const updated = await this.repository.update(vetId, input);
    return toVetDto(updated);
  }

  async getMyProfile(userId: string): Promise<VetDto> {
    const vet = await this.repository.findByUserId(userId);
    if (!vet) {
      throw new NotFoundError("Không tìm thấy hồ sơ bác sĩ");
    }
    return toVetDto(vet);
  }

  // Public — the "pick a vet" step of booking an Appointment.
  async listPublicByHospital(hospitalId: string): Promise<VetSummaryDto[]> {
    const vets = await this.repository.findManyActiveByHospital(hospitalId);
    return vets.map(toVetSummaryDto);
  }
}
