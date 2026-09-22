import { Injectable } from "@nestjs/common";
import type { HospitalReviewSummaryDto, ReviewDto } from "@petcare/types";
import { ConflictError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { ReviewRepository } from "./review.repository";
import { toReviewDto } from "./review.types";
import type { CreateReviewInput, UpdateReviewInput } from "./review.validator";

@Injectable()
export class ReviewService {
  constructor(
    private readonly repository: ReviewRepository,
    private readonly hospitalRepository: HospitalRepository,
  ) {}

  async create(userId: string, input: CreateReviewInput): Promise<ReviewDto> {
    const hospital = await this.hospitalRepository.findById(input.hospitalId);
    if (!hospital) {
      throw new NotFoundError("Không tìm thấy phòng khám");
    }

    const hasVisited = await this.repository.hasCompletedAppointment(userId, input.hospitalId);
    if (!hasVisited) {
      throw new ForbiddenError("Bạn cần hoàn thành ít nhất một lịch khám tại phòng khám này để đánh giá");
    }

    const existing = await this.repository.findByUserAndHospital(userId, input.hospitalId);
    if (existing) {
      throw new ConflictError("Bạn đã đánh giá phòng khám này rồi, hãy chỉnh sửa đánh giá cũ thay vì tạo mới");
    }

    const review = await this.repository.create({
      userId,
      hospitalId: input.hospitalId,
      rating: input.rating,
      comment: input.comment,
    });
    return toReviewDto(review);
  }

  async update(id: string, userId: string, input: UpdateReviewInput): Promise<ReviewDto> {
    const review = await this.repository.findById(id);
    if (!review) {
      throw new NotFoundError("Không tìm thấy đánh giá");
    }
    if (review.userId !== userId) {
      throw new ForbiddenError("Bạn không có quyền chỉnh sửa đánh giá này");
    }
    const updated = await this.repository.update(id, input);
    return toReviewDto(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.repository.findById(id);
    if (!review) {
      throw new NotFoundError("Không tìm thấy đánh giá");
    }
    if (review.userId !== userId) {
      throw new ForbiddenError("Bạn không có quyền xoá đánh giá này");
    }
    await this.repository.delete(id);
  }

  async listByHospital(hospitalId: string): Promise<HospitalReviewSummaryDto> {
    const reviews = await this.repository.findManyByHospital(hospitalId);
    const totalCount = reviews.length;
    const averageRating =
      totalCount > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10 : 0;
    return { hospitalId, averageRating, totalCount, reviews: reviews.map(toReviewDto) };
  }

  async listMine(userId: string): Promise<ReviewDto[]> {
    const reviews = await this.repository.findManyByUser(userId);
    return reviews.map(toReviewDto);
  }
}
