/*
  Warnings:

  - A unique constraint covering the columns `[conversation_id]` on the table `Cost` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Cost" ADD COLUMN     "conversation_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Cost_conversation_id_key" ON "public"."Cost"("conversation_id");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."Cost"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;
