import { Injectable } from "@nestjs/common";
import type { AdminUserDto } from "@petcare/types";
import type { UserRole } from "@prisma/client";
import { BadRequestError, ConflictError, NotFoundError } from "../../common/errors/app-error";
import { MailerService } from "../../lib/mailer.service";
import { generateOpaqueToken } from "../../lib/tokens";
import { UserRepository } from "./user.repository";
import { toAdminUserDto } from "./user.types";
import type { AdminCreateUserInput, AdminUpdateUserInput, ListUsersQuery } from "./user.validator";

const INVITE_TOKEN_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly mailer: MailerService,
  ) {}

  async list(filter: ListUsersQuery): Promise<AdminUserDto[]> {
    const users = await this.repository.findMany(filter);
    return users.map(toAdminUserDto);
  }

  // Same invite-by-email pattern as VetService.create — no plaintext
  // password ever passes through this API, the user sets their own via
  // the emailed reset-password link.
  async create(input: AdminCreateUserInput): Promise<AdminUserDto> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email này đã có tài khoản trong hệ thống");
    }

    const passwordResetToken = generateOpaqueToken();
    const passwordResetExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * DAY_MS);

    const user = await this.repository.create({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role as UserRole,
      emailVerifiedAt: new Date(),
      passwordResetToken,
      passwordResetExpiresAt,
    });

    const content = this.mailer.buildUserInvitedContent(user.name, passwordResetToken);
    await this.mailer.send({ to: user.email, ...content });

    return toAdminUserDto(user);
  }

  async update(id: string, input: AdminUpdateUserInput): Promise<AdminUserDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }
    const updated = await this.repository.update(id, input);
    return toAdminUserDto(updated);
  }

  // Soft delete — flips status to INACTIVE instead of a hard DB delete,
  // since pets/posts/reviews/appointments/medical records all cascade
  // from a user row. `update()` can flip status back to ACTIVE to reactivate.
  async deactivate(id: string, requesterId: string): Promise<AdminUserDto> {
    if (id === requesterId) {
      throw new BadRequestError("Không thể tự vô hiệu hoá chính tài khoản của bạn");
    }
    return this.update(id, { status: "INACTIVE" });
  }
}
