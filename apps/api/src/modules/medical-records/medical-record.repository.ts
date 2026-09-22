import { Injectable } from "@nestjs/common";
import type {
  Hospital,
  MedicalFile,
  MedicalRecord,
  MedicalRecordVersion,
  Pet,
  Prisma,
  User,
  Veterinarian,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type MedicalRecordWithRelations = MedicalRecord & {
  pet: Pet;
  vet: (Veterinarian & { user: User }) | null;
  hospital: Hospital | null;
  versions: (MedicalRecordVersion & { editedBy: User })[];
  files: MedicalFile[];
};

interface RecordContent {
  diagnosis?: string;
  treatment?: string;
  symptoms?: string;
  cause?: string;
  conclusion?: string;
  notes?: string;
}

const include = {
  pet: true,
  vet: { include: { user: true } },
  hospital: true,
  versions: { include: { editedBy: true }, orderBy: { versionNo: "desc" } },
  files: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.MedicalRecordInclude;

@Injectable()
export class MedicalRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    petId: string;
    vetId: string;
    hospitalId: string;
    recordDate: Date;
    editedById: string;
    content: RecordContent;
  }): Promise<MedicalRecordWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.medicalRecord.create({
        data: {
          petId: data.petId,
          vetId: data.vetId,
          hospitalId: data.hospitalId,
          recordDate: data.recordDate,
        },
      });
      const version = await tx.medicalRecordVersion.create({
        data: { recordId: record.id, versionNo: 1, editedById: data.editedById, ...data.content },
      });
      await tx.medicalRecord.update({ where: { id: record.id }, data: { currentVersionId: version.id } });
      return tx.medicalRecord.findUniqueOrThrow({ where: { id: record.id }, include });
    });
  }

  findById(id: string): Promise<MedicalRecordWithRelations | null> {
    return this.prisma.medicalRecord.findUnique({ where: { id }, include });
  }

  findManyByPet(petId: string): Promise<MedicalRecordWithRelations[]> {
    return this.prisma.medicalRecord.findMany({ where: { petId }, include, orderBy: { recordDate: "desc" } });
  }

  findManyByVet(vetId: string): Promise<MedicalRecordWithRelations[]> {
    return this.prisma.medicalRecord.findMany({ where: { vetId }, include, orderBy: { recordDate: "desc" } });
  }

  async addVersion(recordId: string, editedById: string, content: RecordContent): Promise<MedicalRecordWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const latest = await tx.medicalRecordVersion.findFirst({
        where: { recordId },
        orderBy: { versionNo: "desc" },
      });
      const version = await tx.medicalRecordVersion.create({
        data: { recordId, versionNo: (latest?.versionNo ?? 0) + 1, editedById, ...content },
      });
      await tx.medicalRecord.update({ where: { id: recordId }, data: { currentVersionId: version.id } });
      return tx.medicalRecord.findUniqueOrThrow({ where: { id: recordId }, include });
    });
  }

  async addFile(recordId: string, data: { fileName: string; fileUrl: string; fileType: string }): Promise<MedicalRecordWithRelations> {
    await this.prisma.medicalFile.create({ data: { recordId, ...data } });
    return this.prisma.medicalRecord.findUniqueOrThrow({ where: { id: recordId }, include });
  }

  // A Medical Record may only be opened for a pet the hospital has actually
  // treated — otherwise any Vet could fabricate a record for a stranger's
  // pet. "Treated" means an Appointment reached at least CONFIRMED, since a
  // still-PENDING request was never actually seen by the clinic.
  async hasHospitalTreatedPet(hospitalId: string, petId: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: { hospitalId, petId, status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } },
    });
    return count > 0;
  }
}
