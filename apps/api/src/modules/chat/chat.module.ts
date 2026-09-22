import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatRepository } from "./chat.repository";

@Module({
  imports: [HospitalModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
