import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import { env, isProduction } from "../config/env";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailerService {
  private readonly resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

  // In dev without RESEND_API_KEY configured yet, log instead of throwing —
  // lets the auth flow be exercised locally before you've signed up for
  // Resend and filled in the key.
  async send({ to, subject, html }: SendEmailInput): Promise<void> {
    if (!this.resend) {
      if (isProduction) {
        throw new Error("RESEND_API_KEY is not configured");
      }
      console.log(`[mailer:dev] To: ${to} | Subject: ${subject}\n${html}`);
      return;
    }

    await this.resend.emails.send({ from: env.emailFrom, to, subject, html });
  }

  buildVerifyEmailContent(name: string, token: string): { subject: string; html: string } {
    const link = `${env.appUrl}/verify-email?token=${token}`;
    return {
      subject: "Xác thực email PetCare của bạn",
      html: `<p>Chào ${name},</p><p>Nhấn vào liên kết dưới đây để xác thực email và kích hoạt tài khoản PetCare:</p><p><a href="${link}">${link}</a></p><p>Liên kết có hiệu lực trong 24 giờ.</p>`,
    };
  }

  buildResetPasswordContent(name: string, token: string): { subject: string; html: string } {
    const link = `${env.appUrl}/reset-password?token=${token}`;
    return {
      subject: "Đặt lại mật khẩu PetCare",
      html: `<p>Chào ${name},</p><p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào liên kết dưới đây (hiệu lực trong 1 giờ):</p><p><a href="${link}">${link}</a></p><p>Nếu không phải bạn, hãy bỏ qua email này.</p>`,
    };
  }

  // Reuses the reset-password page/flow as the account-activation flow —
  // the new HOSPITAL_OWNER user has no password yet, so "reset" and "set
  // for the first time" are the same operation.
  buildPartnerApprovedContent(ownerName: string, token: string): { subject: string; html: string } {
    const link = `${env.appUrl}/reset-password?token=${token}`;
    return {
      subject: "Hồ sơ phòng khám của bạn đã được duyệt",
      html: `<p>Chào ${ownerName},</p><p>Phòng khám của bạn đã được PetCare duyệt. Nhấn vào liên kết dưới đây để đặt mật khẩu và bắt đầu sử dụng tài khoản (hiệu lực trong 7 ngày):</p><p><a href="${link}">${link}</a></p>`,
    };
  }

  buildPartnerRejectedContent(ownerName: string, reason?: string): { subject: string; html: string } {
    return {
      subject: "Hồ sơ đăng ký phòng khám chưa được duyệt",
      html: `<p>Chào ${ownerName},</p><p>Rất tiếc, hồ sơ đăng ký phòng khám của bạn chưa được duyệt.</p>${
        reason ? `<p>Lý do: ${reason}</p>` : ""
      }<p>Bạn có thể liên hệ với chúng tôi để biết thêm chi tiết hoặc nộp lại hồ sơ.</p>`,
    };
  }

  // Same reset-password-as-first-activation pattern as
  // buildPartnerApprovedContent — the Hospital creates this VET account
  // directly (no password set), so the vet activates via emailed link
  // instead of ever being handed a default password.
  buildVetInvitedContent(vetName: string, hospitalName: string, token: string): { subject: string; html: string } {
    const link = `${env.appUrl}/reset-password?token=${token}`;
    return {
      subject: `${hospitalName} đã tạo tài khoản bác sĩ cho bạn trên PetCare`,
      html: `<p>Chào ${vetName},</p><p>${hospitalName} đã tạo tài khoản bác sĩ cho bạn trên PetCare. Nhấn vào liên kết dưới đây để đặt mật khẩu và bắt đầu sử dụng tài khoản (hiệu lực trong 7 ngày):</p><p><a href="${link}">${link}</a></p>`,
    };
  }
}
