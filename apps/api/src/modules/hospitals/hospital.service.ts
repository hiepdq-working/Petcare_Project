import { Injectable } from "@nestjs/common";
import type { HospitalDto, HospitalSearchResultDto } from "@petcare/types";
import { NotFoundError } from "../../common/errors/app-error";
import { HospitalRepository } from "./hospital.repository";
import { toHospitalDto } from "./hospital.types";
import type {
  AdminCreateHospitalInput,
  AdminUpdateHospitalInput,
  SearchHospitalsInput,
  UpdateHospitalInput,
} from "./hospital.validator";

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

  // Public — only an ACTIVE hospital is visible to browsing Pet Owners,
  // same rule the geo-search list applies.
  async getPublicById(id: string): Promise<HospitalDto> {
    const hospital = await this.repository.findById(id);
    if (!hospital || hospital.status !== "ACTIVE") {
      throw new NotFoundError("Không tìm thấy phòng khám");
    }
    return toHospitalDto(hospital);
  }

  // Admin-facing — every hospital regardless of status.
  async adminList(): Promise<HospitalDto[]> {
    const hospitals = await this.repository.findMany();
    return hospitals.map(toHospitalDto);
  }

  async adminCreate(input: AdminCreateHospitalInput): Promise<HospitalDto> {
    const hospital = await this.repository.create(input);
    return toHospitalDto(hospital);
  }

  async adminUpdate(id: string, input: AdminUpdateHospitalInput): Promise<HospitalDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Không tìm thấy phòng khám");
    }
    const updated = await this.repository.update(id, input);
    return toHospitalDto(updated);
  }

  // Soft delete — flips status to INACTIVE instead of a hard DB delete,
  // since appointments/medical records/posts/reviews all cascade from a
  // hospital row and a hard delete would silently destroy that history.
  // adminUpdate can flip status back to ACTIVE, doubling as "reactivate".
  async adminDeactivate(id: string): Promise<HospitalDto> {
    return this.adminUpdate(id, { status: "INACTIVE" });
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
