import { Module } from "@nestjs/common";
import { PartnerRegistrationController } from "./partner-registration.controller";
import { PartnerRegistrationService } from "./partner-registration.service";
import { PartnerRegistrationRepository } from "./partner-registration.repository";
import { MailerService } from "../../lib/mailer.service";

@Module({
  controllers: [PartnerRegistrationController],
  providers: [PartnerRegistrationService, PartnerRegistrationRepository, MailerService],
})
export class PartnerRegistrationModule {}
