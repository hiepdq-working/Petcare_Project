import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { SecurityModule } from "./common/security/security.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [PrismaModule, SecurityModule, AuthModule],
})
export class AppModule {}
