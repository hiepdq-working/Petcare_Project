import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: env.webOrigin, credentials: true });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(env.port);
  console.log(`PetCare API listening on http://localhost:${env.port}/api`);
}

bootstrap();
