import { Module } from "@nestjs/common";
import { HospitalController } from "./hospital.controller";
import { HospitalService } from "./hospital.service";
import { HospitalRepository } from "./hospital.repository";

@Module({
  controllers: [HospitalController],
  providers: [HospitalService, HospitalRepository],
})
export class HospitalModule {}
