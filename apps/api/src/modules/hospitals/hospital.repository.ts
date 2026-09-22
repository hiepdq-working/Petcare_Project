import { Injectable } from "@nestjs/common";
import type { Hospital, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HospitalRepository {
  constructor(private readonly prisma: PrismaService) {}

  // One owner -> one hospital in the current approval flow (see
  // PartnerRegistrationRepository.createHospitalOwnerWithHospital).
  findByOwnerId(ownerId: string): Promise<Hospital | null> {
    return this.prisma.hospital.findFirst({ where: { ownerId } });
  }

  update(id: string, data: Prisma.HospitalUpdateInput): Promise<Hospital> {
    return this.prisma.hospital.update({ where: { id }, data });
  }
}
