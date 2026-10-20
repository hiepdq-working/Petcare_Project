-- CreateEnum
CREATE TYPE "PostKind" AS ENUM ('NORMAL', 'PROMOTION');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "discount_text" VARCHAR(60),
ADD COLUMN     "kind" "PostKind" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "promo_ends_at" TIMESTAMP(3),
ADD COLUMN     "promo_starts_at" TIMESTAMP(3),
ADD COLUMN     "promo_title" VARCHAR(120);

-- CreateIndex
CREATE INDEX "posts_kind_promo_ends_at_idx" ON "posts"("kind", "promo_ends_at");
