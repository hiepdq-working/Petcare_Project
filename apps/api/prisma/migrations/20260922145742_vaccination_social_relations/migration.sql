-- AlterTable
ALTER TABLE "vaccinations" ADD COLUMN     "created_by_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

