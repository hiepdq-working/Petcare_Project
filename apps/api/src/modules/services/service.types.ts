import type { Service } from "@prisma/client";
import type { ServiceDto } from "@petcare/types";

export function toServiceDto(service: Service): ServiceDto {
  return {
    id: service.id,
    hospitalId: service.hospitalId!,
    name: service.name,
    description: service.description,
    price: service.price ? Number(service.price) : null,
    duration: service.duration,
    createdAt: service.createdAt.toISOString(),
  };
}
