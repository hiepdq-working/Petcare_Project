import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { HospitalStaffController } from "./hospital-staff.controller";
import { HospitalStaffService } from "./hospital-staff.service";
import { HospitalStaffRepository } from "./hospital-staff.repository";
import { MailerService } from "../../lib/mailer.service";

@Module({
  imports: [HospitalModule],
  controllers: [HospitalStaffController],
  providers: [HospitalStaffService, HospitalStaffRepository, MailerService],
})
export class HospitalStaffModule {}
