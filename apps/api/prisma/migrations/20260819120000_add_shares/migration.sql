-- CreateEnum
CREATE TYPE "ShareResourceType" AS ENUM ('DATA_ROOM', 'FOLDER', 'FILE');

-- CreateEnum
CREATE TYPE "ShareKind" AS ENUM ('PUBLIC_LINK', 'USER');

-- CreateEnum
CREATE TYPE "ShareRole" AS ENUM ('VIEWER', 'EDITOR');

-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "data_room_id" TEXT NOT NULL,
    "resource_type" "ShareResourceType" NOT NULL,
    "resource_id" TEXT NOT NULL,
    "kind" "ShareKind" NOT NULL,
    "token" TEXT,
    "grantee_user_id" TEXT,
    "grantee_email" TEXT,
    "role" "ShareRole" NOT NULL DEFAULT 'VIEWER',
    "created_by_id" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shares_token_key" ON "shares"("token");

-- CreateIndex
CREATE INDEX "shares_data_room_id_idx" ON "shares"("data_room_id");

-- CreateIndex
CREATE INDEX "shares_resource_type_resource_id_idx" ON "shares"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "shares_grantee_user_id_idx" ON "shares"("grantee_user_id");

-- CreateIndex
CREATE INDEX "shares_grantee_email_idx" ON "shares"("grantee_email");

-- One active public link per resource
CREATE UNIQUE INDEX "shares_active_public_link_idx"
  ON "shares"("resource_type", "resource_id")
  WHERE "kind" = 'PUBLIC_LINK' AND "revoked_at" IS NULL;

-- One active user invite per email per resource
CREATE UNIQUE INDEX "shares_active_user_email_idx"
  ON "shares"("resource_type", "resource_id", lower("grantee_email"))
  WHERE "kind" = 'USER' AND "revoked_at" IS NULL AND "grantee_email" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_data_room_id_fkey" FOREIGN KEY ("data_room_id") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_grantee_user_id_fkey" FOREIGN KEY ("grantee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
