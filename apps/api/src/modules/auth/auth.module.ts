import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { MailerService } from "../../lib/mailer.service";
import { GoogleAuthService } from "../../lib/google-auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, MailerService, GoogleAuthService],
})
export class AuthModule {}
