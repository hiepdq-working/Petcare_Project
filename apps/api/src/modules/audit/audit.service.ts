import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

interface LogInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

// Who changed what, when — required for anything sensitive (medical
// records later, and admin actions like approving/rejecting a clinic now).
// See ARCHITECTURE.md "AuditLog".
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValue: input.oldValue as Prisma.InputJsonValue,
        newValue: input.newValue as Prisma.InputJsonValue,
      },
    });
  }
}
