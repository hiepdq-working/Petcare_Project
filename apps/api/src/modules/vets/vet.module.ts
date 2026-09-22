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
})
export class VetModule {}
