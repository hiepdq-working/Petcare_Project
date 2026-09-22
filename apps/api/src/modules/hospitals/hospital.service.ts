import { Injectable } from "@nestjs/common";
import type { HospitalDto, HospitalSearchResultDto } from "@petcare/types";
import { NotFoundError } from "../../common/errors/app-error";
import { HospitalRepository } from "./hospital.repository";
import { toHospitalDto } from "./hospital.types";
import type { SearchHospitalsInput, UpdateHospitalInput } from "./hospital.validator";

@Injectable()
export class HospitalService {
  constructor(private readonly repository: HospitalRepository) {}

  async getMine(ownerId: string): Promise<HospitalDto> {
    const hospital = await this.repository.findByOwnerId(ownerId);
    if (!hospital) {
      throw new NotFoundError("Không tìm thấy phòng khám của tài khoản này");
    }
    return toHospitalDto(hospital);
  }

  async updateMine(ownerId: string, input: UpdateHospitalInput): Promise<HospitalDto> {
    const hospital = await this.repository.findByOwnerId(ownerId);
    if (!hospital) {
      throw new NotFoundError("Không tìm thấy phòng khám của tài khoản này");
    }
    const updated = await this.repository.update(hospital.id, input);
    return toHospitalDto(updated);
  }

  async searchNearby(input: SearchHospitalsInput): Promise<HospitalSearchResultDto[]> {
    const radiusMeters = input.radiusKm * 1000;
    const rows = await this.repository.findNearby(input.lat, input.lng, radiusMeters, input.limit);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      logo: row.logo,
      cover: row.cover,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      phone: row.phone,
      isEmergency: row.isEmergency,
      distanceKm: Math.round((row.distanceMeters / 1000) * 10) / 10,
    }));
  }
}
