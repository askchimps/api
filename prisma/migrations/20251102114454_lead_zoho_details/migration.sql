/*
  Warnings:

  - The values [CHAT,MESSAGE,CALL] on the enum `COST_TYPE` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `Lead` table. All the data in the column will be lost.
  - Added the required column `zoho_last_name` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."COST_TYPE_new" AS ENUM ('STT', 'LLM', 'TTS', 'VAPI');
ALTER TABLE "public"."Cost" ALTER COLUMN "type" TYPE "public"."COST_TYPE_new" USING ("type"::text::"public"."COST_TYPE_new");
ALTER TYPE "public"."COST_TYPE" RENAME TO "COST_TYPE_old";
ALTER TYPE "public"."COST_TYPE_new" RENAME TO "COST_TYPE";
DROP TYPE "public"."COST_TYPE_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Lead" DROP COLUMN "name",
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "zoho_city" TEXT,
ADD COLUMN     "zoho_country" TEXT,
ADD COLUMN     "zoho_email" TEXT,
ADD COLUMN     "zoho_first_name" TEXT,
ADD COLUMN     "zoho_last_name" TEXT NOT NULL,
ADD COLUMN     "zoho_lead_disposition" TEXT,
ADD COLUMN     "zoho_lead_owner" TEXT,
ADD COLUMN     "zoho_lead_source" TEXT,
ADD COLUMN     "zoho_mobile" TEXT,
ADD COLUMN     "zoho_state" TEXT,
ADD COLUMN     "zoho_status" TEXT,
ADD COLUMN     "zoho_street" TEXT;

-- AlterTable
ALTER TABLE "public"."Organisation" ADD COLUMN     "expenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "income" DOUBLE PRECISION NOT NULL DEFAULT 0;
