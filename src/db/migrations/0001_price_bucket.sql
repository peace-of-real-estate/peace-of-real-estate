CREATE TYPE "public"."agent_price_bucket" AS ENUM('under400k', '400kTo750k', '750kTo1_5m', '1_5mPlus');--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "typical_price_range" SET DATA TYPE "public"."agent_price_bucket" USING "typical_price_range"::"public"."agent_price_bucket";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "price_min" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "price_max" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "price_min" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "price_max" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" DROP COLUMN "price_range";--> statement-breakpoint
ALTER TABLE "seller_profiles" DROP COLUMN "price_range";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_price_range_check" CHECK ("price_min" >= 0 AND "price_max" <= 2000000 AND "price_min" <= "price_max");--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_price_range_check" CHECK ("price_min" >= 0 AND "price_max" <= 2000000 AND "price_min" <= "price_max");