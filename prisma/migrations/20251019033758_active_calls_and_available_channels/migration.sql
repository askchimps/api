-- AlterTable
ALTER TABLE "public"."Organisation" ADD COLUMN     "active_calls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "available_indian_channels" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "available_international_channels" INTEGER NOT NULL DEFAULT 1;
