import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { ServiceController } from "./service.controller";
import { ServiceService } from "./service.service";
import { ServiceRepository } from "./service.repository";

@Module({
  imports: [HospitalModule],
  controllers: [ServiceController],
  providers: [ServiceService, ServiceRepository],
})
export class ServiceModule {}
