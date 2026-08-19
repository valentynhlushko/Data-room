-- CreateTable
CREATE TABLE "data_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Data Room',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_root" BOOLEAN NOT NULL DEFAULT false,
    "data_room_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_rooms_owner_id_idx" ON "data_rooms"("owner_id");

-- CreateIndex
CREATE INDEX "folders_data_room_id_idx" ON "folders"("data_room_id");

-- CreateIndex
CREATE INDEX "folders_parent_id_idx" ON "folders"("parent_id");

-- One root folder per data room
CREATE UNIQUE INDEX "folders_one_root_per_room_idx" ON "folders"("data_room_id") WHERE "is_root" = true;

-- Unique folder names among siblings
CREATE UNIQUE INDEX "folders_child_sibling_name_idx" ON "folders"("parent_id", "name") WHERE "parent_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "data_rooms" ADD CONSTRAINT "data_rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_data_room_id_fkey" FOREIGN KEY ("data_room_id") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
