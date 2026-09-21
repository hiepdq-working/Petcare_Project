import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { SecurityModule } from "./common/security/security.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PetModule } from "./modules/pets/pet.module";
import { UploadsModule } from "./modules/uploads/uploads.module";

@Module({
  imports: [PrismaModule, SecurityModule, AuthModule, PetModule, UploadsModule],
})
export class AppModule {}
