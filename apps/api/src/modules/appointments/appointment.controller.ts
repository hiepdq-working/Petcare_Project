import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import type { AppointmentStatus } from "@prisma/client";
import { UserRole } from "@petcare/types";
import { ok } from "../../common/response/api-response";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { RolesGuard } from "../../common/security/roles.guard";
import { Roles } from "../../common/security/roles.decorator";
import { CurrentUser } from "../../common/security/current-user.decorator";
import type { RequestAuth } from "../../common/security/jwt-payload";
import { AppointmentService } from "./appointment.service";
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentStatusInput,
} from "./appointment.validator";

@Controller("appointments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  @Post()
  @Roles(UserRole.PET_OWNER)
  async create(
    @CurrentUser() auth: RequestAuth,
    @Body(new ZodValidationPipe(createAppointmentSchema)) body: CreateAppointmentInput,
  ) {
    const appointment = await this.service.create(auth.userId, body);
    return ok(appointment, "Đặt lịch hẹn thành công, phòng khám sẽ sớm xác nhận");
  }

  @Get("mine")
  @Roles(UserRole.PET_OWNER)
  async listMine(@CurrentUser() auth: RequestAuth) {
    const appointments = await this.service.listMine(auth.userId);
    return ok(appointments);
  }

  @Get("hospital")
  @Roles(UserRole.HOSPITAL_OWNER)
  async listForHospital(@CurrentUser() auth: RequestAuth, @Query("status") status?: AppointmentStatus) {
    const appointments = await this.service.listForHospital(auth.userId, status);
    return ok(appointments);
  }

  @Get("vet")
  @Roles(UserRole.VET)
  async listForVet(@CurrentUser() auth: RequestAuth) {
    const appointments = await this.service.listForVet(auth.userId);
    return ok(appointments);
  }

  @Patch(":id/status")
  @Roles(UserRole.HOSPITAL_OWNER)
  async updateStatus(
    @CurrentUser() auth: RequestAuth,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateAppointmentStatusSchema)) body: UpdateAppointmentStatusInput,
  ) {
    const appointment = await this.service.updateStatus(auth.userId, id, body.status, body.notes);
    return ok(appointment, "Cập nhật trạng thái lịch hẹn thành công");
  }

  @Patch(":id/cancel")
  @Roles(UserRole.PET_OWNER)
  async cancelMine(@CurrentUser() auth: RequestAuth, @Param("id") id: string) {
    const appointment = await this.service.cancelMine(auth.userId, id);
    return ok(appointment, "Đã huỷ lịch hẹn");
  }
}
