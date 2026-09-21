import { Injectable } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { BadRequestError } from "../common/errors/app-error";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}

@Injectable()
export class GoogleAuthService {
  private readonly client = new OAuth2Client(env.googleClientId);

  // Verifies the ID token was actually issued by Google for OUR client ID —
  // never trust an idToken's payload without this round trip.
  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    if (!env.googleClientId) {
      throw new BadRequestError("Đăng nhập Google chưa được cấu hình");
    }

    const ticket = await this.client.verifyIdToken({ idToken, audience: env.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new BadRequestError("Token Google không hợp lệ");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      avatar: payload.picture ?? null,
    };
  }
}
