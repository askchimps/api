-- CreateIndex
CREATE INDEX "Lead_first_name_idx" ON "public"."Lead"("first_name");

-- CreateIndex
CREATE INDEX "Lead_last_name_idx" ON "public"."Lead"("last_name");

-- CreateIndex
CREATE INDEX "Lead_first_name_last_name_idx" ON "public"."Lead"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "ZohoLead_first_name_idx" ON "public"."ZohoLead"("first_name");

-- CreateIndex
CREATE INDEX "ZohoLead_last_name_idx" ON "public"."ZohoLead"("last_name");

-- CreateIndex
CREATE INDEX "ZohoLead_first_name_last_name_idx" ON "public"."ZohoLead"("first_name", "last_name");
