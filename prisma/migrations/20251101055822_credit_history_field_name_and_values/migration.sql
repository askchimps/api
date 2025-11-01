/*
  Warnings:

  - Added the required column `change_field` to the `CreditHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `new_value` to the `CreditHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prev_value` to the `CreditHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CreditHistory" ADD COLUMN     "change_field" TEXT NOT NULL,
ADD COLUMN     "new_value" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "prev_value" DOUBLE PRECISION NOT NULL;
