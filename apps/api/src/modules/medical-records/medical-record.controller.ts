import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { MedicalRecordService } from "./medical-record.service";
import {
  addMedicalFileSchema,
  addMedicalRecordVersionSchema,
  createMedicalRecordSchema,
  type AddMedicalFileInput,
  type AddMedicalRecordVersionInput,
  type CreateMedicalRecordInput,
} from "./medical-record.validator";

@Controller("medical-records")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordController {
  constructor(private readonly service: MedicalRecordService) {}

  @Post()
  @Roles(UserRole.VET)
  async create(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(createMedicalRecordSchema)) body: CreateMedicalRecordInput,
  ) {
    const record = await this.service.create(auth.userId, body);
    return ok(record, "Tạo hồ sơ bệnh án thành công");
  }

  @Get("mine")
  @Roles(UserRole.VET)
  async listMine(@CurrentUser() auth: RequestAuth) {
    const records = await this.service.listMine(auth.userId);
    return ok(records);
  }

  @Get("pet/:petId")
  @Roles(UserRole.PET_OWNER)
  async listByPet(@CurrentUser() auth: RequestAuth, @Param("petId") petId: string) {
    const records = await this.service.listByPet(petId, auth.userId);
    return ok(records);
  }

  @Get(":id")
  @Roles(UserRole.PET_OWNER, UserRole.VET)
  async getOne(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const record = await this.service.getOne(id, auth.userId, auth.role);
    return ok(record);
  }

  @Patch(":id")
  @Roles(UserRole.VET)
  async addVersion(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addMedicalRecordVersionSchema)) body: AddMedicalRecordVersionInput,
  ) {
    const record = await this.service.addVersion(id, auth.userId, body);
    return ok(record, "Cập nhật hồ sơ bệnh án thành công");
  }

  @Post(":id/files")
  @Roles(UserRole.VET)
  async addFile(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addMedicalFileSchema)) body: AddMedicalFileInput,
  ) {
    const record = await this.service.addFile(id, auth.userId, body);
    return ok(record, "Đã thêm file đính kèm");
  }
}
