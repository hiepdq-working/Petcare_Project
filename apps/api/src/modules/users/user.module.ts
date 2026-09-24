import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { MailerService } from "../../lib/mailer.service";

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, MailerService],
})
export class UserModule {}
