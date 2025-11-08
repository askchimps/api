-- AlterTable
ALTER TABLE "public"."Agent" ADD COLUMN     "assistant_id" TEXT,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Agent_id_seq";
