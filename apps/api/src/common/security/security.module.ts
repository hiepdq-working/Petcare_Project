import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { env } from "../../config/env";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";
import { PasswordHasher } from "./password-hasher.service";

// @Global so every feature module (pets, appointments, ...) can use
// JwtAuthGuard / RolesGuard / PasswordHasher without re-importing this
// module — registered once here in AppModule.
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: env.jwtAccessSecret,
      signOptions: { expiresIn: env.jwtAccessExpiresIn },
    }),
  ],
  providers: [JwtAuthGuard, RolesGuard, PasswordHasher],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, PasswordHasher],
})
export class SecurityModule {}
