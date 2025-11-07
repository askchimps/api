/*
  Warnings:

  - You are about to drop the column `conversation_id` on the `Cost` table. All the data in the column will be lost.
  - You are about to drop the column `test_call_id` on the `Cost` table. All the data in the column will be lost.
  - You are about to drop the column `additional_info` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `follow_ups` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `in_process` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `logs` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `organisation_id` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_city` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_country` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_description` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_email` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_first_name` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_id` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_last_name` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_lead_disposition` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_lead_owner` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_lead_owner_first_name` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_lead_owner_id` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_lead_owner_last_name` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_lead_owner_phone` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_lead_source` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_mobile` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_state` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_status` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_street` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `conversation_id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `is_disabled` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `active_indian_call_lead_ids` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `active_international_call_lead_ids` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `conversation_credits` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `credits_plan` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `income` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the column `message_credits` on the `Organisation` table. All the data in the column will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestCall` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Topic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ConversationToTopic` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug,organisation_id]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,organisation_id]` on the table `UserOrganisation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CHAT_SOURCE" AS ENUM ('WHATSAPP', 'INSTAGRAM');

-- DropForeignKey
ALTER TABLE "public"."Agent" DROP CONSTRAINT "Agent_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cost" DROP CONSTRAINT "Cost_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cost" DROP CONSTRAINT "Cost_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cost" DROP CONSTRAINT "Cost_test_call_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."CreditHistory" DROP CONSTRAINT "CreditHistory_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lead" DROP CONSTRAINT "Lead_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."TestCall" DROP CONSTRAINT "TestCall_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserOrganisation" DROP CONSTRAINT "UserOrganisation_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserOrganisation" DROP CONSTRAINT "UserOrganisation_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ConversationToTopic" DROP CONSTRAINT "_ConversationToTopic_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ConversationToTopic" DROP CONSTRAINT "_ConversationToTopic_B_fkey";

-- DropIndex
DROP INDEX "public"."Lead_zoho_id_key";

-- DropIndex
DROP INDEX "public"."Message_organisation_id_agent_id_created_at_role_idx";

-- DropIndex
DROP INDEX "public"."Message_organisation_id_created_at_role_idx";

-- AlterTable
ALTER TABLE "public"."Cost" DROP COLUMN "conversation_id",
DROP COLUMN "test_call_id",
ADD COLUMN     "call_id" INTEGER,
ADD COLUMN     "chat_id" INTEGER,
ADD COLUMN     "is_deleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "message_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."CreditHistory" ADD COLUMN     "is_deleted" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Lead" DROP COLUMN "additional_info",
DROP COLUMN "follow_ups",
DROP COLUMN "in_process",
DROP COLUMN "logs",
DROP COLUMN "organisation_id",
DROP COLUMN "zoho_city",
DROP COLUMN "zoho_country",
DROP COLUMN "zoho_description",
DROP COLUMN "zoho_email",
DROP COLUMN "zoho_first_name",
DROP COLUMN "zoho_id",
DROP COLUMN "zoho_last_name",
DROP COLUMN "zoho_lead_disposition",
DROP COLUMN "zoho_lead_owner",
DROP COLUMN "zoho_lead_owner_first_name",
DROP COLUMN "zoho_lead_owner_id",
DROP COLUMN "zoho_lead_owner_last_name",
DROP COLUMN "zoho_lead_owner_phone",
DROP COLUMN "zoho_lead_source",
DROP COLUMN "zoho_mobile",
DROP COLUMN "zoho_state",
DROP COLUMN "zoho_status",
DROP COLUMN "zoho_street",
ADD COLUMN     "call_active" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "follow_up_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_deleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_follow_up" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "conversation_id",
DROP COLUMN "is_disabled",
ADD COLUMN     "call_id" INTEGER,
ADD COLUMN     "chat_id" INTEGER,
ADD COLUMN     "total_cost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Organisation" DROP COLUMN "active_indian_call_lead_ids",
DROP COLUMN "active_international_call_lead_ids",
DROP COLUMN "conversation_credits",
DROP COLUMN "credits_plan",
DROP COLUMN "income",
DROP COLUMN "message_credits",
ADD COLUMN     "chat_credits" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."UserOrganisation" ADD COLUMN     "is_deleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_disabled" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."Conversation";

-- DropTable
DROP TABLE "public"."Payment";

-- DropTable
DROP TABLE "public"."TestCall";

-- DropTable
DROP TABLE "public"."Topic";

-- DropTable
DROP TABLE "public"."_ConversationToTopic";

-- DropEnum
DROP TYPE "public"."CONVERSATION_TYPE";

-- DropEnum
DROP TYPE "public"."CREDITS_PLAN";

-- CreateTable
CREATE TABLE "public"."ZohoLeadOwner" (
    "id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZohoLeadOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ZohoLead" (
    "id" TEXT NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "lead_owner_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "source" TEXT,
    "disposition" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "requires_human_action" INTEGER DEFAULT 0,
    "is_handled_by_human" INTEGER DEFAULT 0,
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZohoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Call" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "from_number" TEXT NOT NULL,
    "to_number" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "summary" TEXT,
    "analysis" TEXT,
    "recording_url" TEXT,
    "call_ended_reason" TEXT,
    "total_cost" DOUBLE PRECISION,
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chat" (
    "id" SERIAL NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "lead_id" INTEGER,
    "source" "public"."CHAT_SOURCE" NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "analysis" TEXT,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION,
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_LeadToOrganisation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LeadToOrganisation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ZohoLeadOwner_email_idx" ON "public"."ZohoLeadOwner"("email");

-- CreateIndex
CREATE INDEX "ZohoLeadOwner_phone_idx" ON "public"."ZohoLeadOwner"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ZohoLead_lead_id_key" ON "public"."ZohoLead"("lead_id");

-- CreateIndex
CREATE INDEX "ZohoLead_lead_owner_id_idx" ON "public"."ZohoLead"("lead_owner_id");

-- CreateIndex
CREATE INDEX "ZohoLead_status_idx" ON "public"."ZohoLead"("status");

-- CreateIndex
CREATE INDEX "ZohoLead_requires_human_action_idx" ON "public"."ZohoLead"("requires_human_action");

-- CreateIndex
CREATE INDEX "ZohoLead_email_idx" ON "public"."ZohoLead"("email");

-- CreateIndex
CREATE INDEX "ZohoLead_phone_idx" ON "public"."ZohoLead"("phone");

-- CreateIndex
CREATE INDEX "Call_started_at_idx" ON "public"."Call"("started_at");

-- CreateIndex
CREATE INDEX "Call_organisation_id_started_at_idx" ON "public"."Call"("organisation_id", "started_at");

-- CreateIndex
CREATE INDEX "Call_agent_id_started_at_idx" ON "public"."Call"("agent_id", "started_at");

-- CreateIndex
CREATE INDEX "Call_lead_id_started_at_idx" ON "public"."Call"("lead_id", "started_at");

-- CreateIndex
CREATE INDEX "Call_status_is_deleted_idx" ON "public"."Call"("status", "is_deleted");

-- CreateIndex
CREATE INDEX "Call_direction_idx" ON "public"."Call"("direction");

-- CreateIndex
CREATE INDEX "Chat_organisation_id_created_at_idx" ON "public"."Chat"("organisation_id", "created_at");

-- CreateIndex
CREATE INDEX "Chat_agent_id_created_at_idx" ON "public"."Chat"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "Chat_lead_id_created_at_idx" ON "public"."Chat"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "Chat_source_created_at_idx" ON "public"."Chat"("source", "created_at");

-- CreateIndex
CREATE INDEX "Chat_status_is_deleted_idx" ON "public"."Chat"("status", "is_deleted");

-- CreateIndex
CREATE INDEX "_LeadToOrganisation_B_index" ON "public"."_LeadToOrganisation"("B");

-- CreateIndex
CREATE INDEX "Agent_slug_idx" ON "public"."Agent"("slug");

-- CreateIndex
CREATE INDEX "Agent_organisation_id_is_deleted_idx" ON "public"."Agent"("organisation_id", "is_deleted");

-- CreateIndex
CREATE INDEX "Agent_phone_number_idx" ON "public"."Agent"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_slug_organisation_id_key" ON "public"."Agent"("slug", "organisation_id");

-- CreateIndex
CREATE INDEX "Cost_organisation_id_created_at_idx" ON "public"."Cost"("organisation_id", "created_at");

-- CreateIndex
CREATE INDEX "Cost_type_created_at_idx" ON "public"."Cost"("type", "created_at");

-- CreateIndex
CREATE INDEX "Cost_call_id_idx" ON "public"."Cost"("call_id");

-- CreateIndex
CREATE INDEX "Cost_chat_id_idx" ON "public"."Cost"("chat_id");

-- CreateIndex
CREATE INDEX "CreditHistory_organisation_id_created_at_idx" ON "public"."CreditHistory"("organisation_id", "created_at");

-- CreateIndex
CREATE INDEX "CreditHistory_change_type_created_at_idx" ON "public"."CreditHistory"("change_type", "created_at");

-- CreateIndex
CREATE INDEX "Lead_phone_number_idx" ON "public"."Lead"("phone_number");

-- CreateIndex
CREATE INDEX "Lead_next_follow_up_idx" ON "public"."Lead"("next_follow_up");

-- CreateIndex
CREATE INDEX "Lead_status_is_deleted_idx" ON "public"."Lead"("status", "is_deleted");

-- CreateIndex
CREATE INDEX "Lead_call_active_idx" ON "public"."Lead"("call_active");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "public"."Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_is_indian_idx" ON "public"."Lead"("is_indian");

-- CreateIndex
CREATE INDEX "Message_call_id_created_at_idx" ON "public"."Message"("call_id", "created_at");

-- CreateIndex
CREATE INDEX "Message_chat_id_created_at_idx" ON "public"."Message"("chat_id", "created_at");

-- CreateIndex
CREATE INDEX "Message_organisation_id_created_at_idx" ON "public"."Message"("organisation_id", "created_at");

-- CreateIndex
CREATE INDEX "Message_role_idx" ON "public"."Message"("role");

-- CreateIndex
CREATE INDEX "Organisation_slug_idx" ON "public"."Organisation"("slug");

-- CreateIndex
CREATE INDEX "Organisation_is_deleted_is_disabled_idx" ON "public"."Organisation"("is_deleted", "is_disabled");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_phone_number_idx" ON "public"."User"("phone_number");

-- CreateIndex
CREATE INDEX "User_is_deleted_is_disabled_idx" ON "public"."User"("is_deleted", "is_disabled");

-- CreateIndex
CREATE INDEX "UserOrganisation_organisation_id_role_idx" ON "public"."UserOrganisation"("organisation_id", "role");

-- CreateIndex
CREATE INDEX "UserOrganisation_user_id_is_deleted_idx" ON "public"."UserOrganisation"("user_id", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganisation_user_id_organisation_id_key" ON "public"."UserOrganisation"("user_id", "organisation_id");

-- AddForeignKey
ALTER TABLE "public"."UserOrganisation" ADD CONSTRAINT "UserOrganisation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOrganisation" ADD CONSTRAINT "UserOrganisation_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditHistory" ADD CONSTRAINT "CreditHistory_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ZohoLead" ADD CONSTRAINT "ZohoLead_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ZohoLead" ADD CONSTRAINT "ZohoLead_lead_owner_id_fkey" FOREIGN KEY ("lead_owner_id") REFERENCES "public"."ZohoLeadOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LeadToOrganisation" ADD CONSTRAINT "_LeadToOrganisation_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LeadToOrganisation" ADD CONSTRAINT "_LeadToOrganisation_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
