import { Injectable } from "@nestjs/common";
import type { Hospital, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface NearbyHospitalRow {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  cover: string | null;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  isEmergency: boolean;
  distanceMeters: number;
}

@Injectable()
export class HospitalRepository {
  constructor(private readonly prisma: PrismaService) {}

  // One owner -> one hospital in the current approval flow (see
  // PartnerRegistrationRepository.createHospitalOwnerWithHospital).
  findByOwnerId(ownerId: string): Promise<Hospital | null> {
    return this.prisma.hospital.findFirst({ where: { ownerId } });
  }

  findById(id: string): Promise<Hospital | null> {
    return this.prisma.hospital.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.HospitalUpdateInput): Promise<Hospital> {
    return this.prisma.hospital.update({ where: { id }, data });
  }

  // Raw SQL because Prisma's query builder can't express earthdistance's
  // ll_to_earth/earth_box functions — see ARCHITECTURE.md "Geo-search".
  // earth_box() uses the GiST index (hospital_geo_idx migration) to cheaply
  // narrow candidates to a bounding box before earth_distance() computes
  // the exact great-circle distance on just that smaller set.
  findNearby(lat: number, lng: number, radiusMeters: number, limit: number): Promise<NearbyHospitalRow[]> {
    return this.prisma.$queryRaw<NearbyHospitalRow[]>`
      SELECT
        id,
        name,
        description,
        logo,
        cover,
        address,
        lat,
        lng,
        phone,
        is_emergency AS "isEmergency",
        earth_distance(ll_to_earth(${lat}, ${lng}), ll_to_earth(lat, lng)) AS "distanceMeters"
      FROM hospitals
      WHERE status = 'ACTIVE'
        AND lat IS NOT NULL
        AND lng IS NOT NULL
        AND earth_box(ll_to_earth(${lat}, ${lng}), ${radiusMeters}) @> ll_to_earth(lat, lng)
      ORDER BY "distanceMeters" ASC
      LIMIT ${limit};
    `;
  }
}
