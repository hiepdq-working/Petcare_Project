import { Module } from "@nestjs/common";
import { PetController } from "./pet.controller";
import { PetService } from "./pet.service";
import { PetRepository } from "./pet.repository";

@Module({
  controllers: [PetController],
  providers: [PetService, PetRepository],
  // AppointmentModule needs PetRepository to verify a booking's pet
  // actually belongs to the requesting Pet Owner.
  exports: [PetRepository],
})
export class PetModule {}
