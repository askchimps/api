/*
  Warnings:

  - A unique constraint covering the columns `[zoho_id]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone_number]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Lead_zoho_id_key" ON "public"."Lead"("zoho_id");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_phone_number_key" ON "public"."Lead"("phone_number");
