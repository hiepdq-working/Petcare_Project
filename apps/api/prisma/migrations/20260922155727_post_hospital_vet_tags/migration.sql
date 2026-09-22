-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "hospital_id" UUID,
ADD COLUMN     "vet_id" UUID;

-- CreateIndex
CREATE INDEX "posts_hospital_id_idx" ON "posts"("hospital_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "veterinarians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

