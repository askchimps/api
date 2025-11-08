-- AlterTable
CREATE SEQUENCE "public".agent_id_seq;
ALTER TABLE "public"."Agent" ALTER COLUMN "id" SET DEFAULT nextval('"public".agent_id_seq');
ALTER SEQUENCE "public".agent_id_seq OWNED BY "public"."Agent"."id";
