-- CreateEnum
CREATE TYPE "public"."AGENT_TYPE" AS ENUM ('CHAT', 'CALL', 'HYBRID');

-- AlterTable
ALTER TABLE "public"."Agent" ADD COLUMN     "type" "public"."AGENT_TYPE" NOT NULL DEFAULT 'CALL';
