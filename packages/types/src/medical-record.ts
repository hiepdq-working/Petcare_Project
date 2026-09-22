export interface MedicalRecordVersionDto {
  id: string;
  versionNo: number;
  diagnosis: string | null;
  treatment: string | null;
  symptoms: string | null;
  cause: string | null;
  conclusion: string | null;
  notes: string | null;
  editedById: string;
  editedByName: string;
  createdAt: string;
}

export interface MedicalFileDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface MedicalRecordDto {
  id: string;
  petId: string;
  petName: string;
  vetId: string | null;
  vetName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
  status: string;
  recordDate: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: MedicalRecordVersionDto | null;
  versions: MedicalRecordVersionDto[];
  files: MedicalFileDto[];
}

export interface MedicalRecordContent {
  diagnosis?: string;
  treatment?: string;
  symptoms?: string;
  cause?: string;
  conclusion?: string;
  notes?: string;
}

export interface CreateMedicalRecordRequest extends MedicalRecordContent {
  petId: string;
  recordDate?: string;
}

export type AddMedicalRecordVersionRequest = MedicalRecordContent;

export interface AddMedicalFileRequest {
  fileName: string;
  fileUrl: string;
  fileType: string;
}
