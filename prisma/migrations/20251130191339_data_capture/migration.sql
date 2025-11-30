-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "disconnected_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."ZohoLead" ADD COLUMN     "reason_for_cold" TEXT;

-- CreateTable
CREATE TABLE "public"."StatusChangeHistory" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "call_id" INTEGER NOT NULL,
    "from_lead_status" TEXT,
    "to_lead_status" TEXT,
    "from_zoho_lead_status" TEXT,
    "to_zoho_lead_status" TEXT,
    "from_zoho_disposition" TEXT,
    "to_zoho_disposition" TEXT,
    "from_zoho_reason_for_cold" TEXT,
    "to_zoho_reason_for_cold" TEXT,
    "reason" TEXT,
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusChangeHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."StatusChangeHistory" ADD CONSTRAINT "StatusChangeHistory_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StatusChangeHistory" ADD CONSTRAINT "StatusChangeHistory_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StatusChangeHistory" ADD CONSTRAINT "StatusChangeHistory_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
