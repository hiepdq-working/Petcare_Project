import { Injectable } from "@nestjs/common";
import type { FavoriteHospitalDto, ToggleFavoriteResponse } from "@petcare/types";
import { NotFoundError } from "../../common/errors/app-error";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { FavoriteRepository } from "./favorite.repository";
import { toFavoriteHospitalDto } from "./favorite.types";

@Injectable()
export class FavoriteService {
  constructor(
    private readonly repository: FavoriteRepository,
    private readonly hospitalRepository: HospitalRepository,
  ) {}

  async toggleHospital(userId: string, hospitalId: string): Promise<ToggleFavoriteResponse> {
    const hospital = await this.hospitalRepository.findById(hospitalId);
    if (!hospital || hospital.status !== "ACTIVE") {
      throw new NotFoundError("Không tìm thấy phòng khám");
    }
    const favorited = await this.repository.toggle(hospitalId, userId);
    return { favorited };
  }

  async listHospitals(userId: string): Promise<FavoriteHospitalDto[]> {
    const favorites = await this.repository.findManyByUser(userId);
    return favorites.map(toFavoriteHospitalDto);
  }
}
