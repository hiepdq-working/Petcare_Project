-- CreateIndex
CREATE INDEX "medical_records_vet_id_idx" ON "medical_records"("vet_id");

-- CreateIndex
CREATE INDEX "medical_records_hospital_id_idx" ON "medical_records"("hospital_id");

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "veterinarians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_versions" ADD CONSTRAINT "medical_record_versions_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

