import { Injectable } from "@nestjs/common";
import type { User, Vaccination } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type VaccinationWithCreator = Vaccination & { createdBy: User };

const include = { createdBy: true } as const;

@Injectable()
export class VaccinationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    petId: string;
    vaccineName: string;
    dateGiven: Date;
    nextDueDate?: Date;
    notes?: string;
    createdById: string;
  }): Promise<VaccinationWithCreator> {
    return this.prisma.vaccination.create({ data, include });
  }

  findManyByPet(petId: string): Promise<VaccinationWithCreator[]> {
    return this.prisma.vaccination.findMany({ where: { petId }, include, orderBy: { dateGiven: "desc" } });
  }

  // Same gate as MedicalRecordRepository.hasHospitalTreatedPet — a Vet may
  // only log a vaccination for a pet their hospital has actually seen.
  async hasHospitalTreatedPet(hospitalId: string, petId: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: { hospitalId, petId, status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } },
    });
    return count > 0;
  }
}
