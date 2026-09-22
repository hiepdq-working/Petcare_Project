import { Injectable } from "@nestjs/common";
import { ShopStatus, UserRole, type Hospital, type PartnerRegistration, type User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreatePartnerRegistrationInput } from "./partner-registration.validator";

@Injectable()
export class PartnerRegistrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePartnerRegistrationInput): Promise<PartnerRegistration> {
    return this.prisma.partnerRegistration.create({
      data: { ...input, businessType: "HOSPITAL" },
    });
  }

  findById(id: string): Promise<PartnerRegistration | null> {
    return this.prisma.partnerRegistration.findUnique({ where: { id } });
  }

  findMany(status?: string): Promise<PartnerRegistration[]> {
    return this.prisma.partnerRegistration.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  markApproved(id: string): Promise<PartnerRegistration> {
    return this.prisma.partnerRegistration.update({ where: { id }, data: { status: "APPROVED" } });
  }

  markRejected(id: string): Promise<PartnerRegistration> {
    return this.prisma.partnerRegistration.update({ where: { id }, data: { status: "REJECTED" } });
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Admin approval is the vetting step, so the new owner is pre-verified
  // and their Hospital goes live immediately — see PartnerRegistrationService.
  createHospitalOwnerWithHospital(input: {
    name: string;
    email: string;
    phone: string;
    shopName: string;
    address: string;
    passwordResetToken: string;
    passwordResetExpiresAt: Date;
  }): Promise<{ user: User; hospital: Hospital }> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          role: UserRole.HOSPITAL_OWNER,
          emailVerifiedAt: new Date(),
          passwordResetToken: input.passwordResetToken,
          passwordResetExpiresAt: input.passwordResetExpiresAt,
        },
      });
      const hospital = await tx.hospital.create({
        data: {
          ownerId: user.id,
          name: input.shopName,
          address: input.address,
          phone: input.phone,
          email: input.email,
          status: ShopStatus.ACTIVE,
        },
      });
      return { user, hospital };
    });
  }
}
