import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { PetModule } from "../pets/pet.module";
import { VetModule } from "../vets/vet.module";
import { PostController } from "./post.controller";
import { PostService } from "./post.service";
import { PostRepository } from "./post.repository";

@Module({
  imports: [PetModule, HospitalModule, VetModule],
  controllers: [PostController],
  providers: [PostService, PostRepository],
})
export class PostModule {}
