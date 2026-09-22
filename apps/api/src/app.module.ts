import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { SecurityModule } from "./common/security/security.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PetModule } from "./modules/pets/pet.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { PartnerRegistrationModule } from "./modules/partners/partner-registration.module";
import { HospitalModule } from "./modules/hospitals/hospital.module";

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    AuditModule,
    AuthModule,
    PetModule,
    UploadsModule,
    PartnerRegistrationModule,
    HospitalModule,
  ],
})
export class AppModule {}
