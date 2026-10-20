-- CreateTable
CREATE TABLE "saved_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_hospitals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hospital_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_posts_user_id_created_at_idx" ON "saved_posts"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_posts_post_id_user_id_key" ON "saved_posts"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "favorite_hospitals_user_id_created_at_idx" ON "favorite_hospitals"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_hospitals_hospital_id_user_id_key" ON "favorite_hospitals"("hospital_id", "user_id");

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_hospitals" ADD CONSTRAINT "favorite_hospitals_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_hospitals" ADD CONSTRAINT "favorite_hospitals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
