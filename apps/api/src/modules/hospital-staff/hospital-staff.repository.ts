import { Injectable } from "@nestjs/common";
import { UserRole, type HospitalStaff, type Prisma, type User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type HospitalStaffWithUser = HospitalStaff & { user: User };

@Injectable()
export class HospitalStaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Creating the login-capable User and the HospitalStaff profile always
  // happens together — a transaction keeps that atomic, same as Vet.create.
  create(
    hospitalId: string,
    input: {
      name: string;
      email: string;
      phone?: string;
      position: "NURSE" | "RECEPTIONIST";
      passwordResetToken: string;
      passwordResetExpiresAt: Date;
    },
  ): Promise<HospitalStaffWithUser> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          role: UserRole.HOSPITAL_STAFF,
          emailVerifiedAt: new Date(),
          passwordResetToken: input.passwordResetToken,
          passwordResetExpiresAt: input.passwordResetExpiresAt,
        },
      });
      return tx.hospitalStaff.create({
        data: { hospitalId, userId: user.id, position: input.position },
        include: { user: true },
      });
    });
  }

  findManyByHospital(hospitalId: string): Promise<HospitalStaffWithUser[]> {
    return this.prisma.hospitalStaff.findMany({
      where: { hospitalId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string): Promise<HospitalStaffWithUser | null> {
    return this.prisma.hospitalStaff.findUnique({ where: { id }, include: { user: true } });
  }

  update(id: string, data: Prisma.HospitalStaffUpdateInput): Promise<HospitalStaffWithUser> {
    return this.prisma.hospitalStaff.update({ where: { id }, data, include: { user: true } });
  }
}
