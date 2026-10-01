import { Injectable } from "@nestjs/common";
import type { HospitalStaffDto } from "@petcare/types";
import { ConflictError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { MailerService } from "../../lib/mailer.service";
import { generateOpaqueToken } from "../../lib/tokens";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { HospitalStaffRepository, type HospitalStaffWithUser } from "./hospital-staff.repository";
import { toHospitalStaffDto } from "./hospital-staff.types";
import type { CreateHospitalStaffInput, UpdateHospitalStaffInput } from "./hospital-staff.validator";

const INVITE_TOKEN_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class HospitalStaffService {
  constructor(
    private readonly repository: HospitalStaffRepository,
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

  private async findOwnedOrThrow(staffId: string, hospitalId: string): Promise<HospitalStaffWithUser> {
    const staff = await this.repository.findById(staffId);
    if (!staff) {
      throw new NotFoundError("Không tìm thấy nhân viên");
    }
    if (staff.hospitalId !== hospitalId) {
      throw new ForbiddenError("Nhân viên này không thuộc phòng khám của bạn");
    }
    return staff;
  }

  async create(ownerId: string, input: CreateHospitalStaffInput): Promise<HospitalStaffDto> {
    const hospital = await this.resolveHospitalId(ownerId);

    const existingUser = await this.repository.findUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError("Email này đã có tài khoản trong hệ thống");
    }

    const passwordResetToken = generateOpaqueToken();
    const passwordResetExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * DAY_MS);

    const staff = await this.repository.create(hospital.id, {
      ...input,
      passwordResetToken,
      passwordResetExpiresAt,
    });

    const content = this.mailer.buildStaffInvitedContent(staff.user.name, hospital.name, passwordResetToken);
    await this.mailer.send({ to: staff.user.email, ...content });

    return toHospitalStaffDto(staff);
  }

  async listMine(ownerId: string): Promise<HospitalStaffDto[]> {
    const hospital = await this.resolveHospitalId(ownerId);
    const staff = await this.repository.findManyByHospital(hospital.id);
    return staff.map(toHospitalStaffDto);
  }

  async update(ownerId: string, staffId: string, input: UpdateHospitalStaffInput): Promise<HospitalStaffDto> {
    const hospital = await this.resolveHospitalId(ownerId);
    await this.findOwnedOrThrow(staffId, hospital.id);
    const updated = await this.repository.update(staffId, input);
    return toHospitalStaffDto(updated);
  }
}
