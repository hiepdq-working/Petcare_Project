import { Injectable } from "@nestjs/common";
import { UserRole, type Prisma, type User, type Veterinarian } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type VetWithUser = Veterinarian & { user: User };

@Injectable()
export class VetRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Creating the login-capable User and the Veterinarian profile always
  // happens together — a transaction keeps that atomic.
  create(
    hospitalId: string,
    input: {
      name: string;
      email: string;
      phone?: string;
      specialty?: string;
      experience?: number;
      licenseNumber?: string;
      passwordResetToken: string;
      passwordResetExpiresAt: Date;
    },
  ): Promise<VetWithUser> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          role: UserRole.VET,
          emailVerifiedAt: new Date(),
          passwordResetToken: input.passwordResetToken,
          passwordResetExpiresAt: input.passwordResetExpiresAt,
        },
      });
      return tx.veterinarian.create({
        data: {
          hospitalId,
          userId: user.id,
          specialty: input.specialty ?? null,
          experience: input.experience ?? null,
          licenseNumber: input.licenseNumber ?? null,
        },
        include: { user: true },
      });
    });
  }

  findManyByHospital(hospitalId: string): Promise<VetWithUser[]> {
    return this.prisma.veterinarian.findMany({
      where: { hospitalId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string): Promise<VetWithUser | null> {
    return this.prisma.veterinarian.findUnique({ where: { id }, include: { user: true } });
  }

  findByUserId(userId: string): Promise<VetWithUser | null> {
    return this.prisma.veterinarian.findUnique({ where: { userId }, include: { user: true } });
  }

  update(id: string, data: Prisma.VeterinarianUpdateInput): Promise<VetWithUser> {
    return this.prisma.veterinarian.update({ where: { id }, data, include: { user: true } });
  }
}
