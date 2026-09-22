import { Injectable } from "@nestjs/common";
import type { Service } from "@prisma/client";
import type { ServiceDto } from "@petcare/types";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { ServiceRepository } from "./service.repository";
import { toServiceDto } from "./service.types";
import type { CreateServiceInput, UpdateServiceInput } from "./service.validator";

@Injectable()
export class ServiceService {
  constructor(
    private readonly repository: ServiceRepository,
    private readonly hospitalRepository: HospitalRepository,
  ) {}

  private async resolveHospitalId(ownerId: string): Promise<string> {
    const hospital = await this.hospitalRepository.findByOwnerId(ownerId);
    if (!hospital) {
      throw new NotFoundError("Không tìm thấy phòng khám của tài khoản này");
    }
    return hospital.id;
  }

  private async findOwnedOrThrow(serviceId: string, hospitalId: string): Promise<Service> {
    const service = await this.repository.findById(serviceId);
    if (!service) {
      throw new NotFoundError("Không tìm thấy dịch vụ");
    }
    if (service.hospitalId !== hospitalId) {
      throw new ForbiddenError("Dịch vụ này không thuộc phòng khám của bạn");
    }
    return service;
  }

  async create(ownerId: string, input: CreateServiceInput): Promise<ServiceDto> {
    const hospitalId = await this.resolveHospitalId(ownerId);
    const service = await this.repository.create(hospitalId, input);
    return toServiceDto(service);
  }

  async listMine(ownerId: string): Promise<ServiceDto[]> {
    const hospitalId = await this.resolveHospitalId(ownerId);
    const services = await this.repository.findManyByHospital(hospitalId);
    return services.map(toServiceDto);
  }

  async update(ownerId: string, serviceId: string, input: UpdateServiceInput): Promise<ServiceDto> {
    const hospitalId = await this.resolveHospitalId(ownerId);
    await this.findOwnedOrThrow(serviceId, hospitalId);
    const updated = await this.repository.update(serviceId, input);
    return toServiceDto(updated);
  }

  async remove(ownerId: string, serviceId: string): Promise<void> {
    const hospitalId = await this.resolveHospitalId(ownerId);
    await this.findOwnedOrThrow(serviceId, hospitalId);
    await this.repository.delete(serviceId);
  }
}
