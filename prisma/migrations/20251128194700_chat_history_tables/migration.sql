/*
  Warnings:

  - You are about to drop the `InstagramChatHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsappChatHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."InstagramChatHistory";

-- DropTable
DROP TABLE "public"."WhatsappChatHistory";

-- CreateTable
CREATE TABLE "public"."instagram_chat_history" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "message" JSONB NOT NULL,

    CONSTRAINT "instagram_chat_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_chat_history" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "message" JSONB NOT NULL,

    CONSTRAINT "whatsapp_chat_history_pkey" PRIMARY KEY ("id")
);
