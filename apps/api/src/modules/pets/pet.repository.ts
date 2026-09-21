import { Injectable } from "@nestjs/common";
import type { Pet, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PetRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, data: Omit<Prisma.PetCreateInput, "owner">): Promise<Pet> {
    return this.prisma.pet.create({ data: { ...data, owner: { connect: { id: ownerId } } } });
  }

  findById(id: string): Promise<Pet | null> {
    return this.prisma.pet.findUnique({ where: { id } });
  }

  findManyByOwner(ownerId: string): Promise<Pet[]> {
    return this.prisma.pet.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
  }

  update(id: string, data: Prisma.PetUpdateInput): Promise<Pet> {
    return this.prisma.pet.update({ where: { id }, data });
  }

  delete(id: string): Promise<Pet> {
    return this.prisma.pet.delete({ where: { id } });
  }
}
