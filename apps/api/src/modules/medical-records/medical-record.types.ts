import type { MedicalFile, MedicalRecordVersion, User } from "@prisma/client";
import type { MedicalFileDto, MedicalRecordDto, MedicalRecordVersionDto } from "@petcare/types";
import type { MedicalRecordWithRelations } from "./medical-record.repository";

function toVersionDto(version: MedicalRecordVersion & { editedBy: User }): MedicalRecordVersionDto {
  return {
    id: version.id,
    versionNo: version.versionNo,
    diagnosis: version.diagnosis,
    treatment: version.treatment,
    symptoms: version.symptoms,
    cause: version.cause,
    conclusion: version.conclusion,
    notes: version.notes,
    editedById: version.editedById,
    editedByName: version.editedBy.name,
    createdAt: version.createdAt.toISOString(),
  };
}

function toFileDto(file: MedicalFile): MedicalFileDto {
  return {
    id: file.id,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    fileType: file.fileType,
    createdAt: file.createdAt.toISOString(),
  };
}

export function toMedicalRecordDto(record: MedicalRecordWithRelations): MedicalRecordDto {
  const versions = record.versions.map(toVersionDto);
  const currentVersion = versions.find((v) => v.id === record.currentVersionId) ?? versions[0] ?? null;
  return {
    id: record.id,
    petId: record.petId,
    petName: record.pet.name,
    vetId: record.vetId,
    vetName: record.vet?.user.name ?? null,
    hospitalId: record.hospitalId,
    hospitalName: record.hospital?.name ?? null,
    status: record.status,
    recordDate: record.recordDate.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    currentVersion,
    versions,
    files: record.files.map(toFileDto),
  };
}
