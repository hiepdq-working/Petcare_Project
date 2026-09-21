import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ok } from "../../common/response/api-response";
import { BadRequestError } from "../../common/errors/app-error";
import { JwtAuthGuard } from "../../common/security/jwt-auth.guard";
import { env } from "../../config/env";
import { imageUploadOptions } from "./multer.config";

// Generic upload endpoint — not owned by any one feature, since Pet
// avatars, user avatars, hospital logos, and post images will all need
// this same disk-upload flow (see ARCHITECTURE.md on local storage now,
// S3/R2 later).
@Controller("uploads")
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(FileInterceptor("file", imageUploadOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestError("Vui lòng chọn file để tải lên");
    }
    return ok({ url: `${env.apiPublicUrl}/uploads/${file.filename}` }, "Tải lên thành công");
  }
}
