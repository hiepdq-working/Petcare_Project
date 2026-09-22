import { Global, Module } from "@nestjs/common";
import { PetEventService } from "./pet-event.service";

@Global()
@Module({
  providers: [PetEventService],
  exports: [PetEventService],
})
export class PetEventModule {}
