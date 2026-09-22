import { Module } from "@nestjs/common";
import { HospitalController } from "./hospital.controller";
import { HospitalService } from "./hospital.service";
import { HospitalRepository } from "./hospital.repository";

@Module({
  controllers: [HospitalController],
  providers: [HospitalService, HospitalRepository],
  // VetModule needs HospitalRepository to resolve "the hospital owned by
  // this HOSPITAL_OWNER" before creating a Vet under it.
  exports: [HospitalRepository],
})
export class HospitalModule {}
