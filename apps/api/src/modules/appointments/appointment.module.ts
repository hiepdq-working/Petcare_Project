import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { PetModule } from "../pets/pet.module";
import { ServiceModule } from "../services/service.module";
import { VetModule } from "../vets/vet.module";
import { AppointmentController } from "./appointment.controller";
import { AppointmentService } from "./appointment.service";
import { AppointmentRepository } from "./appointment.repository";

@Module({
  imports: [HospitalModule, PetModule, ServiceModule, VetModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentRepository],
})
export class AppointmentModule {}
