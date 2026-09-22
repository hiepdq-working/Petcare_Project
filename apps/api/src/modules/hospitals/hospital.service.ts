import { Injectable } from "@nestjs/common";
import type { HospitalDto } from "@petcare/types";
import { NotFoundError } from "../../common/errors/app-error";
import { HospitalRepository } from "./hospital.repository";
import { toHospitalDto } from "./hospital.types";
import type { UpdateHospitalInput } from "./hospital.validator";

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
}
