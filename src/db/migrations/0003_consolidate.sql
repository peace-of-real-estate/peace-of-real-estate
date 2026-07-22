CREATE TYPE "public"."client_role" AS ENUM('buyer', 'seller');--> statement-breakpoint
CREATE TYPE "public"."entitlement_key" AS ENUM('client_lifetime_premium', 'agent_subscription');--> statement-breakpoint
CREATE TYPE "public"."entitlement_source" AS ENUM('manual', 'stripe_checkout', 'stripe_subscription');--> statement-breakpoint
CREATE TABLE "buyer_details" (
	"client_profile_id" text PRIMARY KEY NOT NULL,
	"role" "client_role" DEFAULT 'buyer' NOT NULL,
	"experience_level" "buyer_experience_level" NOT NULL,
	"ideal_agent_relationship" "buyer_ideal_agent_relationship" NOT NULL,
	"decision_making_need" "buyer_decision_making_need" NOT NULL,
	"bidding_war_response" "buyer_bidding_war_response" NOT NULL,
	CONSTRAINT "buyer_details_role_check" CHECK ("buyer_details"."role" = 'buyer')
);
--> statement-breakpoint
CREATE TABLE "client_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" "client_role" NOT NULL,
	"status" "profile_status" DEFAULT 'draft' NOT NULL,
	"state" text NOT NULL,
	"city" text NOT NULL,
	"zip_codes" text[] DEFAULT '{}' NOT NULL,
	"city_center_latitude" double precision DEFAULT NULL,
	"city_center_longitude" double precision DEFAULT NULL,
	"timeline" timeline NOT NULL,
	"price_range" text NOT NULL,
	"property_types" "property_type"[] NOT NULL,
	"quick_communication_channel" "quick_communication_channel" NOT NULL,
	"update_delivery_method" "update_delivery_method" NOT NULL,
	"response_time_expectation" "response_time_expectation" NOT NULL,
	"involvement_level" "involvement_level" NOT NULL,
	"commission_comfort" "commission_comfort" NOT NULL,
	"match_priorities" text[],
	"match_details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "client_profiles_id_role_index" UNIQUE("id","role")
);
--> statement-breakpoint
CREATE TABLE "seller_details" (
	"client_profile_id" text PRIMARY KEY NOT NULL,
	"role" "client_role" DEFAULT 'seller' NOT NULL,
	"sale_motivation" "seller_sale_motivation" NOT NULL,
	"successful_sale_looks_like" "seller_successful_sale_looks_like" NOT NULL,
	"home_connection" "seller_home_connection" NOT NULL,
	"agent_silence_preference" "seller_agent_silence_preference" NOT NULL,
	"representation_preference" "seller_representation_preference" NOT NULL,
	"agent_delivery_expectations" "seller_agent_delivery_expectations"[] NOT NULL,
	CONSTRAINT "seller_details_role_check" CHECK ("seller_details"."role" = 'seller')
);
--> statement-breakpoint
ALTER TABLE "buyer_profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seller_profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "buyer_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "seller_profiles" CASCADE;--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP CONSTRAINT "agent_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_entitlements" ALTER COLUMN "key" SET DATA TYPE "public"."entitlement_key" USING "key"::"public"."entitlement_key";--> statement-breakpoint
ALTER TABLE "user_entitlements" ALTER COLUMN "source" SET DATA TYPE "public"."entitlement_source" USING "source"::"public"."entitlement_source";--> statement-breakpoint
ALTER TABLE "buyer_details" ADD CONSTRAINT "buyer_details_profile_role_fk" FOREIGN KEY ("client_profile_id","role") REFERENCES "public"."client_profiles"("id","role") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_details" ADD CONSTRAINT "seller_details_profile_role_fk" FOREIGN KEY ("client_profile_id","role") REFERENCES "public"."client_profiles"("id","role") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_profiles_user_role_index" ON "client_profiles" USING btree ("user_id","role");--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;