import { mkdirSync } from "node:fs";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import { diskStorage } from "multer";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { BadRequestError } from "../../common/errors/app-error";

export const UPLOAD_DIR = "uploads";
export const DOCUMENTS_DIR = "uploads/documents";
mkdirSync(UPLOAD_DIR, { recursive: true });
mkdirSync(DOCUMENTS_DIR, { recursive: true });

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([...ALLOWED_IMAGE_MIME_TYPES, "application/pdf"]);

function randomFilename(originalname: string): string {
  return `${randomUUID()}${extname(originalname)}`;
}

// Pet/user avatars — small, images only.
export const imageUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, callback) => callback(null, randomFilename(file.originalname)),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(new BadRequestError("Chỉ chấp nhận file ảnh JPEG, PNG hoặc WEBP"), false);
      return;
    }
    callback(null, true);
  },
};

// Business documents (license, vet certificate) attached to a public,
// unauthenticated PartnerRegistration submission — scans are often PDF,
// so this allows a larger size and PDF on top of images. Stored under a
// separate directory so it can be moderated/cleaned independently of
// avatars, and only ever reached through a rate-limited route (see
// IpRateLimitGuard) since there's no logged-in identity to hold accountable.
export const documentUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: DOCUMENTS_DIR,
    filename: (_req, file, callback) => callback(null, randomFilename(file.originalname)),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
      callback(new BadRequestError("Chỉ chấp nhận file ảnh JPEG, PNG, WEBP hoặc PDF"), false);
      return;
    }
    callback(null, true);
  },
};
