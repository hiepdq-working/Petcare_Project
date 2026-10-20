import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { FavoriteController } from "./favorite.controller";
import { FavoriteService } from "./favorite.service";
import { FavoriteRepository } from "./favorite.repository";

@Module({
  imports: [HospitalModule],
  controllers: [FavoriteController],
  providers: [FavoriteService, FavoriteRepository],
  // PostModule needs the follower list to notify about promotions.
  exports: [FavoriteRepository],
})
export class FavoriteModule {}
