-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
