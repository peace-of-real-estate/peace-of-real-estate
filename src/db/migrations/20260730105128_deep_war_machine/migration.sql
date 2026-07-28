ALTER TABLE "agent_profiles" ADD COLUMN "best_client_type" "best_client_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "representation_side" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "representation_side";--> statement-breakpoint
CREATE TYPE "representation_side" AS ENUM('buyer', 'seller');--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "representation_side" SET DATA TYPE "representation_side" USING "representation_side"::"representation_side";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "best_client_types";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "first_name";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "last_name";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "business_address";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "average_transactions";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "employment_status";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "license_proof";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "use_pax_writer";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "license_attested";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "eo_insurance_status";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "peace_pact_signed";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "peace_pact_signature";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "peace_pact_signed_at";--> statement-breakpoint
ALTER TABLE "buyer_details" DROP CONSTRAINT "buyer_details_role_check", ADD CONSTRAINT "buyer_details_role_check" CHECK ("role" = 'buyer');--> statement-breakpoint
ALTER TABLE "seller_details" DROP CONSTRAINT "seller_details_role_check", ADD CONSTRAINT "seller_details_role_check" CHECK ("role" = 'seller');--> statement-breakpoint
DROP TYPE "average_transactions";