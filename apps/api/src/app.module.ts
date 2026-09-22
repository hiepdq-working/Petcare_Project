import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { SecurityModule } from "./common/security/security.module";
import { AuditModule } from "./modules/audit/audit.module";
import { PetEventModule } from "./modules/pet-events/pet-event.module";
import { NotificationModule } from "./modules/notifications/notification.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PetModule } from "./modules/pets/pet.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { PartnerRegistrationModule } from "./modules/partners/partner-registration.module";
import { HospitalModule } from "./modules/hospitals/hospital.module";
import { VetModule } from "./modules/vets/vet.module";
import { ServiceModule } from "./modules/services/service.module";
import { AppointmentModule } from "./modules/appointments/appointment.module";
import { MedicalRecordModule } from "./modules/medical-records/medical-record.module";
import { VaccinationModule } from "./modules/vaccinations/vaccination.module";
import { PostModule } from "./modules/posts/post.module";
import { ReviewModule } from "./modules/reviews/review.module";

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    AuditModule,
    PetEventModule,
    NotificationModule,
    AuthModule,
    PetModule,
    UploadsModule,
    PartnerRegistrationModule,
    HospitalModule,
    VetModule,
    ServiceModule,
    AppointmentModule,
    MedicalRecordModule,
    VaccinationModule,
    PostModule,
    ReviewModule,
  ],
})
export class AppModule {}
