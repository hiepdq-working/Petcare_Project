import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { SecurityModule } from "./common/security/security.module";
import { AuditModule } from "./modules/audit/audit.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { PetEventModule } from "./modules/pet-events/pet-event.module";
import { NotificationModule } from "./modules/notifications/notification.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PetModule } from "./modules/pets/pet.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { PartnerRegistrationModule } from "./modules/partners/partner-registration.module";
import { HospitalModule } from "./modules/hospitals/hospital.module";
import { UserModule } from "./modules/users/user.module";
import { VetModule } from "./modules/vets/vet.module";
import { ServiceModule } from "./modules/services/service.module";
import { AppointmentModule } from "./modules/appointments/appointment.module";
import { MedicalRecordModule } from "./modules/medical-records/medical-record.module";
import { VaccinationModule } from "./modules/vaccinations/vaccination.module";
import { PostModule } from "./modules/posts/post.module";
import { ReviewModule } from "./modules/reviews/review.module";
import { ChatModule } from "./modules/chat/chat.module";

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    AuditModule,
    RealtimeModule,
    PetEventModule,
    NotificationModule,
    AuthModule,
    PetModule,
    UploadsModule,
    PartnerRegistrationModule,
    HospitalModule,
    UserModule,
    VetModule,
    ServiceModule,
    AppointmentModule,
    MedicalRecordModule,
    VaccinationModule,
    PostModule,
    ReviewModule,
    ChatModule,
  ],
})
export class AppModule {}
