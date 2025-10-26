-- AlterTable
ALTER TABLE "public"."Conversation" ALTER COLUMN "duration" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Organisation" ALTER COLUMN "conversation_credits" SET DEFAULT 0,
ALTER COLUMN "conversation_credits" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "message_credits" SET DEFAULT 0,
ALTER COLUMN "message_credits" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "call_credits" SET DEFAULT 0,
ALTER COLUMN "call_credits" SET DATA TYPE DOUBLE PRECISION;
