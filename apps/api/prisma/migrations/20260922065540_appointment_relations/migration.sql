-- CreateIndex
CREATE INDEX "appointments_vet_id_date_time_idx" ON "appointments"("vet_id", "date_time");

-- CreateIndex
CREATE INDEX "appointments_hospital_id_date_time_idx" ON "appointments"("hospital_id", "date_time");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "veterinarians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

