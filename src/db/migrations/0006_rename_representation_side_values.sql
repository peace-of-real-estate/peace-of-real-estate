CREATE TYPE "public"."years_licensed" AS ENUM ('0-2', '3-5', '6-10', '10+');--> statement-breakpoint
CREATE TYPE "public"."average_transactions" AS ENUM ('0-5', '6-15', '16-30', '30+');--> statement-breakpoint
CREATE TYPE "public"."timeline" AS ENUM ('exploring', '1month', '2months', '3months', '4months', '5months', '6months', '7months', '8months', '9months', '10months', '11months', '12monthsPlus');--> statement-breakpoint
ALTER TYPE "public"."representation_side" RENAME TO "representation_side_old";--> statement-breakpoint
CREATE TYPE "public"."representation_side" AS ENUM ('buyers', 'sellers', 'both');--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "representation_side" SET DATA TYPE "public"."representation_side" USING CASE WHEN "representation_side"::text = 'buying' THEN 'buyers'::"public"."representation_side" WHEN "representation_side"::text = 'selling' THEN 'sellers'::"public"."representation_side" ELSE "representation_side"::text::"public"."representation_side" END;--> statement-breakpoint
DROP TYPE "public"."representation_side_old";--> statement-breakpoint
UPDATE "agent_profiles" SET "years_licensed" = NULL WHERE "years_licensed" = '';--> statement-breakpoint
UPDATE "agent_profiles" SET "average_transactions" = NULL WHERE "average_transactions" = '';--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP CONSTRAINT IF EXISTS "agent_profiles_representation_side_check";--> statement-breakpoint
ALTER TABLE "buyer_profiles" DROP CONSTRAINT IF EXISTS "buyer_profiles_status_check";--> statement-breakpoint
ALTER TABLE "seller_profiles" DROP CONSTRAINT IF EXISTS "seller_profiles_status_check";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "years_licensed" SET DATA TYPE "public"."years_licensed" USING "years_licensed"::"public"."years_licensed";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "average_transactions" SET DATA TYPE "public"."average_transactions" USING "average_transactions"::"public"."average_transactions";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "timeline" SET DATA TYPE "public"."timeline" USING "timeline"::"public"."timeline";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "timeline" SET DATA TYPE "public"."timeline" USING "timeline"::"public"."timeline";
