import { Injectable } from "@nestjs/common";
import type { Prisma, Review, User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type ReviewWithUser = Review & { user: User };

const include = { user: true } satisfies Prisma.ReviewInclude;

// Review is intentionally polymorphic (providerType/providerId, no FK) so
// it can later cover Shop as well as Hospital — this repository only ever
// deals in providerType: "HOSPITAL" since Shop isn't built in this MVP.
const HOSPITAL = "HOSPITAL";

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { userId: string; hospitalId: string; rating: number; comment?: string }): Promise<ReviewWithUser> {
    return this.prisma.review.create({
      data: {
        userId: data.userId,
        providerType: HOSPITAL,
        providerId: data.hospitalId,
        rating: data.rating,
        comment: data.comment,
      },
      include,
    });
  }

  findById(id: string): Promise<ReviewWithUser | null> {
    return this.prisma.review.findUnique({ where: { id }, include });
  }

  findByUserAndHospital(userId: string, hospitalId: string): Promise<Review | null> {
    return this.prisma.review.findFirst({
      where: { userId, providerType: HOSPITAL, providerId: hospitalId },
    });
  }

  findManyByHospital(hospitalId: string): Promise<ReviewWithUser[]> {
    return this.prisma.review.findMany({
      where: { providerType: HOSPITAL, providerId: hospitalId },
      include,
      orderBy: { createdAt: "desc" },
    });
  }

  findManyByUser(userId: string): Promise<ReviewWithUser[]> {
    return this.prisma.review.findMany({
      where: { userId, providerType: HOSPITAL },
      include,
      orderBy: { createdAt: "desc" },
    });
  }

  update(id: string, data: { rating?: number; comment?: string }): Promise<ReviewWithUser> {
    return this.prisma.review.update({ where: { id }, data, include });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id } });
  }

  // A review may only be written by someone who has actually completed a
  // visit — the same trust boundary used elsewhere (Medical Record,
  // Vaccination) to stop fabricated entries about a hospital/pet no
  // relationship exists with.
  async hasCompletedAppointment(userId: string, hospitalId: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: { userId, hospitalId, status: "COMPLETED" },
    });
    return count > 0;
  }
}
