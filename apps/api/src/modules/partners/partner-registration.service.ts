import { Injectable } from "@nestjs/common";
import type { PartnerRegistrationDto } from "@petcare/types";
import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { AuditService } from "../audit/audit.service";
import { MailerService } from "../../lib/mailer.service";
import { generateOpaqueToken } from "../../lib/tokens";
import { PartnerRegistrationRepository } from "./partner-registration.repository";
import { toPartnerRegistrationDto } from "./partner-registration.types";
import type { CreatePartnerRegistrationInput } from "./partner-registration.validator";

const INVITE_TOKEN_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PartnerRegistrationService {
  constructor(
    private readonly repository: PartnerRegistrationRepository,
    private readonly mailer: MailerService,
    private readonly audit: AuditService,
  ) {}

  async submit(input: CreatePartnerRegistrationInput): Promise<{ message: string }> {
    await this.repository.create(input);
    return { message: "Đăng ký thành công. Chúng tôi sẽ liên hệ sau khi duyệt hồ sơ." };
  }

  async listAll(status?: string): Promise<PartnerRegistrationDto[]> {
    const items = await this.repository.findMany(status);
    return items.map(toPartnerRegistrationDto);
  }

  async getOne(id: string): Promise<PartnerRegistrationDto> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundError("Không tìm thấy đơn đăng ký");
    }
    return toPartnerRegistrationDto(item);
  }

  async approve(id: string, adminId: string): Promise<void> {
    const registration = await this.repository.findById(id);
    if (!registration) {
      throw new NotFoundError("Không tìm thấy đơn đăng ký");
    }
    if (registration.status !== "PENDING") {
      throw new ConflictError("Đơn đăng ký đã được xử lý trước đó");
    }

    const existingUser = await this.repository.findUserByEmail(registration.email);
    if (existingUser) {
      throw new ConflictError("Email này đã có tài khoản trong hệ thống");
    }

    const passwordResetToken = generateOpaqueToken();
    const passwordResetExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * DAY_MS);

    const { user, hospital } = await this.repository.createHospitalOwnerWithHospital({
      name: registration.ownerName,
      email: registration.email,
      phone: registration.phone,
      shopName: registration.shopName,
      address: registration.address,
      passwordResetToken,
      passwordResetExpiresAt,
    });

    await this.repository.markApproved(id);

    await this.audit.log({
      actorId: adminId,
      action: "APPROVE",
      entityType: "PartnerRegistration",
      entityId: id,
      newValue: { userId: user.id, hospitalId: hospital.id },
    });

    const content = this.mailer.buildPartnerApprovedContent(user.name, passwordResetToken);
    await this.mailer.send({ to: user.email, ...content });
  }

  async reject(id: string, adminId: string, reason?: string): Promise<void> {
    const registration = await this.repository.findById(id);
    if (!registration) {
      throw new NotFoundError("Không tìm thấy đơn đăng ký");
    }
    if (registration.status !== "PENDING") {
      throw new ConflictError("Đơn đăng ký đã được xử lý trước đó");
    }

    await this.repository.markRejected(id);

    await this.audit.log({
      actorId: adminId,
      action: "REJECT",
      entityType: "PartnerRegistration",
      entityId: id,
      newValue: { reason: reason ?? null },
    });

    const content = this.mailer.buildPartnerRejectedContent(registration.ownerName, reason);
    await this.mailer.send({ to: registration.email, ...content });
  }
}
