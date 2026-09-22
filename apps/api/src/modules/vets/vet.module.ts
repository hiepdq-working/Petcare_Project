import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { VetController } from "./vet.controller";
import { VetService } from "./vet.service";
import { VetRepository } from "./vet.repository";
import { MailerService } from "../../lib/mailer.service";

@Module({
  imports: [HospitalModule],
  controllers: [VetController],
  providers: [VetService, VetRepository, MailerService],
  // AppointmentModule needs VetRepository to validate a requested vet and
  // to resolve "which vet am I" when a VET lists their own appointments.
  exports: [VetRepository],
})
export class VetModule {}
