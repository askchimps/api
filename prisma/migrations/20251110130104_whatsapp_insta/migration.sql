/*
  Warnings:

  - A unique constraint covering the columns `[instagram_id]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[whatsapp_id]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Chat" ADD COLUMN     "human_handled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "instagram_id" TEXT,
ADD COLUMN     "whatsapp_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_instagram_id_key" ON "public"."Chat"("instagram_id");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_whatsapp_id_key" ON "public"."Chat"("whatsapp_id");
