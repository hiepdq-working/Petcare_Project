-- AlterTable
ALTER TABLE "hospitals" ADD COLUMN     "notify_new_appointment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_new_message" BOOLEAN NOT NULL DEFAULT true;
