import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { PetModule } from "../pets/pet.module";
import { VetModule } from "../vets/vet.module";
import { MedicalRecordController } from "./medical-record.controller";
import { MedicalRecordService } from "./medical-record.service";
import { MedicalRecordRepository } from "./medical-record.repository";

@Module({
  imports: [PetModule, VetModule, HospitalModule],
  controllers: [MedicalRecordController],
  providers: [MedicalRecordService, MedicalRecordRepository],
})
export class MedicalRecordModule {}
