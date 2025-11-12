/*
  Warnings:

  - You are about to drop the `ChatReadStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ChatReadStatus" DROP CONSTRAINT "ChatReadStatus_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatReadStatus" DROP CONSTRAINT "ChatReadStatus_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Chat" ADD COLUMN     "unread_messages" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."ChatReadStatus";
