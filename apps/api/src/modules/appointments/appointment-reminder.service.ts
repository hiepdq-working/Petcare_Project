import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { NotificationService } from "../notifications/notification.service";
import { AppointmentRepository } from "./appointment.repository";

const REMINDER_HORIZON_MS = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const FIRST_SWEEP_DELAY_MS = 15 * 1000;

// Sends one in-app reminder per confirmed appointment once it is within 24h.
// A plain interval instead of a scheduler dependency — the claim in
// AppointmentRepository.claimReminder keeps it safe if several API
// instances ever run a sweep at the same time.
@Injectable()
export class AppointmentReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentReminderService.name);
  private firstSweep?: NodeJS.Timeout;
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly repository: AppointmentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit(): void {
    this.firstSweep = setTimeout(() => void this.sweep(), FIRST_SWEEP_DELAY_MS);
    this.firstSweep.unref();
    this.interval = setInterval(() => void this.sweep(), SWEEP_INTERVAL_MS);
    this.interval.unref();
  }

  onModuleDestroy(): void {
    if (this.firstSweep) clearTimeout(this.firstSweep);
    if (this.interval) clearInterval(this.interval);
  }

  async sweep(): Promise<void> {
    try {
      const now = new Date();
      const due = await this.repository.findDueForReminder(now, REMINDER_HORIZON_MS);
      for (const appointment of due) {
        if (!(await this.repository.claimReminder(appointment.id, now))) continue;

        const whenText = appointment.dateTime.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
        const base = {
          type: "APPOINTMENT" as const,
          title: `Nhắc lịch khám: ${appointment.pet.name} lúc ${whenText}`,
          content: `${appointment.service.name} · ${appointment.hospital?.name ?? "Phòng khám"}`,
          refId: appointment.id,
        };

        await this.notificationService.create({ ...base, userId: appointment.userId });
        if (appointment.vet) {
          await this.notificationService.create({ ...base, userId: appointment.vet.userId });
        }
      }
    } catch (error) {
      this.logger.error("Appointment reminder sweep failed", error instanceof Error ? error.stack : String(error));
    }
  }
}
