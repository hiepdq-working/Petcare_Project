import { Injectable } from "@nestjs/common";
import type { FavoriteHospital, Hospital } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type FavoriteWithHospital = FavoriteHospital & { hospital: Hospital };

@Injectable()
export class FavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(hospitalId: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.favoriteHospital.findUnique({
      where: { hospitalId_userId: { hospitalId, userId } },
    });
    if (existing) {
      await this.prisma.favoriteHospital.delete({ where: { id: existing.id } });
      return false;
    }
    await this.prisma.favoriteHospital.create({ data: { hospitalId, userId } });
    return true;
  }

  findManyByUser(userId: string): Promise<FavoriteWithHospital[]> {
    return this.prisma.favoriteHospital.findMany({
      where: { userId, hospital: { status: "ACTIVE" } },
      include: { hospital: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Everyone who favorited this hospital — used to target promotion
  // notifications.
  async findFollowerIds(hospitalId: string): Promise<string[]> {
    const rows = await this.prisma.favoriteHospital.findMany({ where: { hospitalId }, select: { userId: true } });
    return rows.map((row) => row.userId);
  }
}
