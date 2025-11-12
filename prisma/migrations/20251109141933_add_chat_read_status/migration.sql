-- CreateTable
CREATE TABLE "public"."ChatReadStatus" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatReadStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatReadStatus_user_id_idx" ON "public"."ChatReadStatus"("user_id");

-- CreateIndex
CREATE INDEX "ChatReadStatus_chat_id_idx" ON "public"."ChatReadStatus"("chat_id");

-- CreateIndex
CREATE INDEX "ChatReadStatus_last_read_at_idx" ON "public"."ChatReadStatus"("last_read_at");

-- CreateIndex
CREATE UNIQUE INDEX "ChatReadStatus_user_id_chat_id_key" ON "public"."ChatReadStatus"("user_id", "chat_id");

-- AddForeignKey
ALTER TABLE "public"."ChatReadStatus" ADD CONSTRAINT "ChatReadStatus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatReadStatus" ADD CONSTRAINT "ChatReadStatus_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
