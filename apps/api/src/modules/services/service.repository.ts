import { Injectable } from "@nestjs/common";
import type { Service } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateServiceInput, UpdateServiceInput } from "./service.validator";

@Injectable()
export class ServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Shop services are out of scope for this MVP (see ARCHITECTURE.md) —
  // every service created here is a Hospital service.
  create(hospitalId: string, input: CreateServiceInput): Promise<Service> {
    return this.prisma.service.create({
      data: { ...input, hospitalId, providerType: "HOSPITAL" },
    });
  }

  findManyByHospital(hospitalId: string): Promise<Service[]> {
    return this.prisma.service.findMany({ where: { hospitalId }, orderBy: { createdAt: "desc" } });
  }

  findById(id: string): Promise<Service | null> {
    return this.prisma.service.findUnique({ where: { id } });
  }

  update(id: string, input: UpdateServiceInput): Promise<Service> {
    return this.prisma.service.update({ where: { id }, data: input });
  }

  delete(id: string): Promise<Service> {
    return this.prisma.service.delete({ where: { id } });
  }
}
