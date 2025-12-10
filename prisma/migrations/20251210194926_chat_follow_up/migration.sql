-- CreateTable
CREATE TABLE "public"."ChatFollowUp" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "follow_up_at" TIMESTAMP(3),
    "follow_up_note" TEXT,
    "follow_up_type" TEXT,
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatFollowUpMessages" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "ChatFollowUpMessages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatFollowUp_chat_id_key" ON "public"."ChatFollowUp"("chat_id");

-- CreateIndex
CREATE INDEX "ChatFollowUp_chat_id_follow_up_at_idx" ON "public"."ChatFollowUp"("chat_id", "follow_up_at");

-- CreateIndex
CREATE UNIQUE INDEX "ChatFollowUpMessages_type_key" ON "public"."ChatFollowUpMessages"("type");

-- CreateIndex
CREATE INDEX "ChatFollowUpMessages_type_idx" ON "public"."ChatFollowUpMessages"("type");

-- AddForeignKey
ALTER TABLE "public"."ChatFollowUp" ADD CONSTRAINT "ChatFollowUp_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
