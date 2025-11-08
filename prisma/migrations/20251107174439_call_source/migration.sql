/*
  Warnings:

  - Added the required column `source` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CALL_SOURCE" AS ENUM ('AUTOMATION', 'WEBSITE', 'MANUAL');

-- AlterTable
ALTER TABLE "public"."Call" ADD COLUMN     "source" "public"."CALL_SOURCE" NOT NULL;
