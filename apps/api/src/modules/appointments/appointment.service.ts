import { Injectable } from "@nestjs/common";
import type { AppointmentStatus } from "@prisma/client";
import type { AppointmentDto } from "@petcare/types";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import { NotificationService } from "../notifications/notification.service";
import { PetEventService } from "../pet-events/pet-event.service";
import { PetRepository } from "../pets/pet.repository";
import { ServiceRepository } from "../services/service.repository";
import { VetRepository } from "../vets/vet.repository";
import { HospitalRepository } from "../hospitals/hospital.repository";
import { AppointmentRepository } from "./appointment.repository";
import { toAppointmentDto } from "./appointment.types";
import type { CreateAppointmentInput } from "./appointment.validator";

// Which status an appointment may move to from its current one — Hospital
// is the only actor that transitions status (see AppointmentController);
// a Pet Owner can only cancel their own via cancelMine().
const ALLOWED_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class AppointmentService {
  constructor(
    private readonly repository: AppointmentRepository,
    private readonly petRepository: PetRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly vetRepository: VetRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly notificationService: NotificationService,
    private readonly petEventService: PetEventService,
  ) {}

  private async resolveHospitalId(ownerId: string): Promise<string> {
    const hospital = await this.hospitalRepository.findByOwnerId(ownerId);
    if (!hospital) {
      throw new NotFoundError("Không tìm thấy phòng khám của tài khoản này");
    }
    return hospital.id;
  }

  async create(petOwnerId: string, input: CreateAppointmentInput): Promise<AppointmentDto> {
    const pet = await this.petRepository.findById(input.petId);
    if (!pet) {
      throw new NotFoundError("Không tìm thấy thú cưng");
    }
    if (pet.ownerId !== petOwnerId) {
      throw new ForbiddenError("Thú cưng này không thuộc tài khoản của bạn");
    }

    const hospital = await this.hospitalRepository.findById(input.hospitalId);
    if (!hospital || hospital.status !== "ACTIVE") {
      throw new NotFoundError("Không tìm thấy phòng khám");
    }

    const service = await this.serviceRepository.findById(input.serviceId);
    if (!service || service.hospitalId !== input.hospitalId) {
      throw new BadRequestError("Dịch vụ không thuộc phòng khám này");
    }

    // A specific vet may be requested, but actual assignment is the
    // Hospital's call when it confirms — see updateStatus(). The conflict
    // check below only makes sense when a specific vet is named: with no
    // vetId, "the slot" isn't a real resource yet (the hospital may have
    // several vets free at that time), so there's nothing to conflict-check.
    if (input.vetId) {
      const vet = await this.vetRepository.findById(input.vetId);
      if (!vet || vet.hospitalId !== input.hospitalId || vet.status !== "ACTIVE") {
        throw new BadRequestError("Bác sĩ không thuộc phòng khám này hoặc không còn hoạt động");
      }
      const conflict = await this.repository.findConflictForVet(input.vetId, input.dateTime);
      if (conflict) {
        throw new ConflictError("Bác sĩ đã có lịch hẹn khác vào khung giờ này");
      }
    }

    const appointment = await this.repository.create({
      petId: input.petId,
      userId: petOwnerId,
      hospitalId: input.hospitalId,
      serviceId: input.serviceId,
      vetId: input.vetId,
      dateTime: input.dateTime,
      notes: input.notes,
      status: "PENDING",
    });

    await this.repository.recordHistory(appointment.id, "PENDING", petOwnerId, "Đặt lịch hẹn");

    const whenText = input.dateTime.toLocaleString("vi-VN");

    // Hospital decides confirm/reject; the requested Vet (if any) only
    // observes — this mirrors the product decision that Vet cannot
    // confirm appointments themselves.
    if (hospital.ownerId) {
      await this.notificationService.create({
        userId: hospital.ownerId,
        type: "APPOINTMENT",
        title: "Có lịch hẹn mới cần xác nhận",
        content: `${pet.name} · ${service.name} · ${whenText}`,
        refId: appointment.id,
      });
    }
    if (appointment.vet) {
      await this.notificationService.create({
        userId: appointment.vet.userId,
        type: "APPOINTMENT",
        title: "Bạn có lịch hẹn mới",
        content: `${pet.name} · ${service.name} · ${whenText}`,
        refId: appointment.id,
      });
    }

    // See ARCHITECTURE.md "PetEvent — trục thời gian trung tâm": booking
    // is meaningful enough on its own to land on the timeline immediately,
    // showing whether it's upcoming or already happened — no second event
    // is published when it later completes, to avoid a duplicate entry.
    await this.petEventService.publish({
      petId: pet.id,
      eventType: "APPOINTMENT",
      eventDate: input.dateTime,
      referenceType: "Appointment",
      referenceId: appointment.id,
      payload: { title: "Lịch hẹn khám", summary: `${service.name} tại ${hospital.name}` },
      createdById: petOwnerId,
    });

    return toAppointmentDto(appointment);
  }

  async listMine(petOwnerId: string): Promise<AppointmentDto[]> {
    const appointments = await this.repository.findManyByPetOwner(petOwnerId);
    return appointments.map(toAppointmentDto);
  }

  async listForHospital(ownerId: string, status?: AppointmentStatus): Promise<AppointmentDto[]> {
    const hospitalId = await this.resolveHospitalId(ownerId);
    const appointments = await this.repository.findManyByHospital(hospitalId, status);
    return appointments.map(toAppointmentDto);
  }

  async listForVet(vetUserId: string): Promise<AppointmentDto[]> {
    const vet = await this.vetRepository.findByUserId(vetUserId);
    if (!vet) {
      throw new NotFoundError("Không tìm thấy hồ sơ bác sĩ");
    }
    const appointments = await this.repository.findManyByVet(vet.id);
    return appointments.map(toAppointmentDto);
  }

  async updateStatus(
    ownerId: string,
    appointmentId: string,
    status: AppointmentStatus,
    notes?: string,
  ): Promise<AppointmentDto> {
    const hospitalId = await this.resolveHospitalId(ownerId);
    const appointment = await this.repository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy lịch hẹn");
    }
    if (appointment.hospitalId !== hospitalId) {
      throw new ForbiddenError("Lịch hẹn này không thuộc phòng khám của bạn");
    }

    const allowed = ALLOWED_TRANSITIONS[appointment.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ConflictError(`Không thể chuyển trạng thái từ ${appointment.status} sang ${status}`);
    }

    const updated = await this.repository.updateStatus(appointmentId, status, ownerId, notes);

    const statusText: Record<string, string> = {
      CONFIRMED: "đã được xác nhận",
      IN_PROGRESS: "đang được thực hiện",
      COMPLETED: "đã hoàn thành",
      CANCELLED: "đã bị huỷ",
    };
    const title = `Lịch hẹn của ${updated.pet.name} ${statusText[status] ?? status}`;
    await this.notificationService.create({
      userId: updated.userId,
      type: "APPOINTMENT",
      title,
      content: notes,
      refId: updated.id,
    });
    if (updated.vet) {
      await this.notificationService.create({
        userId: updated.vet.userId,
        type: "APPOINTMENT",
        title,
        content: notes,
        refId: updated.id,
      });
    }

    return toAppointmentDto(updated);
  }

  async cancelMine(petOwnerId: string, appointmentId: string): Promise<AppointmentDto> {
    const appointment = await this.repository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError("Không tìm thấy lịch hẹn");
    }
    if (appointment.userId !== petOwnerId) {
      throw new ForbiddenError("Lịch hẹn này không thuộc tài khoản của bạn");
    }
    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      throw new ConflictError("Chỉ có thể huỷ lịch hẹn đang chờ hoặc đã xác nhận");
    }

    const updated = await this.repository.updateStatus(
      appointmentId,
      "CANCELLED",
      petOwnerId,
      "Huỷ bởi chủ thú cưng",
    );

    if (updated.hospital?.ownerId) {
      await this.notificationService.create({
        userId: updated.hospital.ownerId,
        type: "APPOINTMENT",
        title: `Lịch hẹn của ${updated.pet.name} đã bị huỷ`,
        content: "Chủ thú cưng đã huỷ lịch hẹn này",
        refId: updated.id,
      });
    }
    if (updated.vet) {
      await this.notificationService.create({
        userId: updated.vet.userId,
        type: "APPOINTMENT",
        title: `Lịch hẹn của ${updated.pet.name} đã bị huỷ`,
        content: "Chủ thú cưng đã huỷ lịch hẹn này",
        refId: updated.id,
      });
    }

    return toAppointmentDto(updated);
  }
}
