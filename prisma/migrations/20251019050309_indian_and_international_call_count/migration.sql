/*
  Warnings:

  - You are about to drop the column `active_calls` on the `Organisation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Organisation" DROP COLUMN "active_calls",
ADD COLUMN     "active_indian_calls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "active_international_calls" INTEGER NOT NULL DEFAULT 0;
