-- AlterEnum
ALTER TYPE "public"."COST_TYPE" ADD VALUE 'MISC';

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "total_cost" DOUBLE PRECISION;
