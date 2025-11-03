-- AlterTable
ALTER TABLE "public"."Cost" ADD COLUMN     "test_call_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."TestCall" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "recording_url" TEXT,
    "call_duration" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_cost" DOUBLE PRECISION,

    CONSTRAINT "TestCall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."TestCall" ADD CONSTRAINT "TestCall_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_test_call_id_fkey" FOREIGN KEY ("test_call_id") REFERENCES "public"."TestCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
