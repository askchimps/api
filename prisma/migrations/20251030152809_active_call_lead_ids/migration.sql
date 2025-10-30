-- AlterTable
ALTER TABLE "public"."Organisation" ADD COLUMN     "active_indian_call_lead_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "active_international_call_lead_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
