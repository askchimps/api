/*
  Warnings:

  - A unique constraint covering the columns `[instagram_id]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[whatsapp_id]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chat_instagram_id_key" ON "public"."Chat"("instagram_id");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_whatsapp_id_key" ON "public"."Chat"("whatsapp_id");
