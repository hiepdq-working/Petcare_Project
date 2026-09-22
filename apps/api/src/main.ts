import "reflect-metadata";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Default CORP is "same-origin", which blocks the SPA (a different
  // origin/port in dev, and typically a different subdomain/CDN in
  // production) from loading images served under /uploads. These are
  // public media (avatars, post photos, hospital logos) meant to be
  // embedded cross-origin, so relax just that policy.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.enableCors({ origin: env.webOrigin, credentials: true });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());
  // Served at http://.../uploads/<file>, outside the /api prefix — see
  // modules/uploads for why this is a generic, feature-agnostic endpoint.
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });

  await app.listen(env.port);
  console.log(`PetCare API listening on http://localhost:${env.port}/api`);
}

bootstrap();
