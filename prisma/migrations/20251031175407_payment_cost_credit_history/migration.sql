-- CreateEnum
CREATE TYPE "public"."COST_TYPE" AS ENUM ('CHAT', 'MESSAGE', 'CALL');

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cost" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "type" "public"."COST_TYPE" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditHistory" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "change_amount" DOUBLE PRECISION NOT NULL,
    "change_type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditHistory" ADD CONSTRAINT "CreditHistory_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
