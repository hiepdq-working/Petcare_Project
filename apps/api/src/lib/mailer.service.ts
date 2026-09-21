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
}
