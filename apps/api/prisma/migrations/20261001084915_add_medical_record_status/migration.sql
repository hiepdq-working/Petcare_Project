-- CreateEnum
CREATE TYPE "MedicalRecordStatus" AS ENUM ('IN_TREATMENT', 'FOLLOW_UP', 'COMPLETED');

-- AlterTable
ALTER TABLE "conversations" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable: every existing row holds the old default "NEW" string — map it
-- onto the new enum's default instead of dropping/recreating the column.
UPDATE "medical_records" SET "status" = 'IN_TREATMENT' WHERE "status" = 'NEW';
ALTER TABLE "medical_records"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "MedicalRecordStatus" USING ("status"::"MedicalRecordStatus"),
  ALTER COLUMN "status" SET DEFAULT 'IN_TREATMENT';
