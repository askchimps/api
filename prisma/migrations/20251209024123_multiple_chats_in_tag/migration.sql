/*
  Warnings:

  - You are about to drop the column `chat_id` on the `Tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Tag" DROP CONSTRAINT "Tag_chat_id_fkey";

-- AlterTable
ALTER TABLE "public"."Tag" DROP COLUMN "chat_id";

-- CreateTable
CREATE TABLE "public"."_ChatToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ChatToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ChatToTag_B_index" ON "public"."_ChatToTag"("B");

-- AddForeignKey
ALTER TABLE "public"."_ChatToTag" ADD CONSTRAINT "_ChatToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChatToTag" ADD CONSTRAINT "_ChatToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
