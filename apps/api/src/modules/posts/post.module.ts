import { Module } from "@nestjs/common";
import { PetModule } from "../pets/pet.module";
import { PostController } from "./post.controller";
import { PostService } from "./post.service";
import { PostRepository } from "./post.repository";

@Module({
  imports: [PetModule],
  controllers: [PostController],
  providers: [PostService, PostRepository],
})
export class PostModule {}
