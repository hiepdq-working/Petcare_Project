import { Module } from "@nestjs/common";
import { HospitalModule } from "../hospitals/hospital.module";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";
import { ReviewRepository } from "./review.repository";

@Module({
  imports: [HospitalModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
