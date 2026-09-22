import { Injectable } from "@nestjs/common";
import type { Appointment, AppointmentStatus, Pet, Prisma, Service, User, Veterinarian } from "@prisma/client";
import type { Hospital } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type AppointmentWithRelations = Appointment & {
  pet: Pet;
  service: Service;
  hospital: Hospital | null;
  vet: (Veterinarian & { user: User }) | null;
};

const include = {
  pet: true,
  service: true,
  hospital: true,
  vet: { include: { user: true } },
} satisfies Prisma.AppointmentInclude;

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AppointmentUncheckedCreateInput): Promise<AppointmentWithRelations> {
    return this.prisma.appointment.create({ data, include });
  }

  findById(id: string): Promise<AppointmentWithRelations | null> {
    return this.prisma.appointment.findUnique({ where: { id }, include });
  }

  findManyByPetOwner(userId: string): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({ where: { userId }, include, orderBy: { dateTime: "desc" } });
  }

  findManyByHospital(hospitalId: string, status?: AppointmentStatus): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: { hospitalId, ...(status ? { status } : {}) },
      include,
      orderBy: { dateTime: "asc" },
    });
  }

  findManyByVet(vetId: string): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({ where: { vetId }, include, orderBy: { dateTime: "asc" } });
  }

  // Conflict check is scoped to a specific vet only — see
  // AppointmentService for why an unassigned request (no vetId) doesn't
  // check for conflicts at all.
  findConflictForVet(vetId: string, dateTime: Date): Promise<Appointment | null> {
    return this.prisma.appointment.findFirst({
      where: { vetId, dateTime, status: { notIn: ["CANCELLED"] } },
    });
  }

  async recordHistory(appointmentId: string, status: AppointmentStatus, changedBy: string, notes?: string): Promise<void> {
    await this.prisma.appointmentHistory.create({ data: { appointmentId, status, changedBy, notes } });
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    changedBy: string,
    notes?: string,
  ): Promise<AppointmentWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({ where: { id }, data: { status }, include });
      await tx.appointmentHistory.create({ data: { appointmentId: id, status, changedBy, notes } });
      return updated;
    });
  }
}
