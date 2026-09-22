import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";

// @Global so every future module (medical records, admin, ...) can log
// without importing this module explicitly — same pattern as
// Prisma/SecurityModule.
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
