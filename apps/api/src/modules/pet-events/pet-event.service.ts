import { Injectable } from "@nestjs/common";
import type { PetEventType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

interface PublishInput {
  petId: string;
  eventType: PetEventType;
  eventDate: Date;
  referenceType?: string;
  referenceId?: string;
  payload?: Record<string, unknown>;
  createdById?: string;
}

// The timeline spine every domain publishes into — see ARCHITECTURE.md
// "PetEvent — trục thời gian trung tâm". A future Pet Timeline page reads
// this single table instead of joining Medical/Vaccination/Appointment/
// Social separately. Global so any module (Appointment first, then
// Medical/Vaccination/Social later) can publish without importing this
// module explicitly.
@Injectable()
export class PetEventService {
  constructor(private readonly prisma: PrismaService) {}

  async publish(input: PublishInput): Promise<void> {
    await this.prisma.petEvent.create({
      data: {
        petId: input.petId,
        eventType: input.eventType,
        eventDate: input.eventDate,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        payload: input.payload as Prisma.InputJsonValue,
        createdById: input.createdById,
      },
    });
  }
}
