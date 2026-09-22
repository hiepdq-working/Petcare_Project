import { Module } from "@nestjs/common";
import { PetModule } from "../pets/pet.module";
import { VetModule } from "../vets/vet.module";
import { VaccinationController } from "./vaccination.controller";
import { VaccinationService } from "./vaccination.service";
import { VaccinationRepository } from "./vaccination.repository";

@Module({
  imports: [PetModule, VetModule],
  controllers: [VaccinationController],
  providers: [VaccinationService, VaccinationRepository],
})
export class VaccinationModule {}
