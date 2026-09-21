import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// @Global so every repository across every future module (pets, medical,
// hospitals, ...) can inject PrismaService directly — only repositories
// talk to Prisma, per ARCHITECTURE.md.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
