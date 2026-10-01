import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  webOrigin: required("WEB_ORIGIN"),
  appUrl: required("APP_URL"),
  // Origin this API is publicly reachable at — used to build absolute
  // URLs for uploaded files (e.g. Pet avatars) returned to clients.
  apiPublicUrl: process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,

  databaseUrl: required("DATABASE_URL"),

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  refreshTokenExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 30),
  cookieDomain: process.env.COOKIE_DOMAIN ?? "localhost",

  // SMTP transport (e.g. Gmail: smtp.gmail.com:587 with an App Password,
  // not your normal login password — Google requires 2FA + a generated
  // App Password for third-party SMTP access).
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "PetCare <no-reply@petcare.local>",

  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
} as const;

export const isProduction = env.nodeEnv === "production";
