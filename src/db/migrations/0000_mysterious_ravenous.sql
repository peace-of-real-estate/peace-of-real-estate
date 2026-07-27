CREATE TYPE "public"."client_role" AS ENUM('buyer', 'seller');--> statement-breakpoint
CREATE TYPE "public"."entitlement_key" AS ENUM('client_lifetime_premium', 'agent_subscription');--> statement-breakpoint
CREATE TYPE "public"."entitlement_source" AS ENUM('manual', 'stripe_checkout', 'stripe_subscription');--> statement-breakpoint
CREATE TYPE "public"."us_postal_code" AS ENUM('AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'AS', 'FM', 'GU', 'MH', 'MP', 'PR', 'PW', 'VI', 'AA', 'AE', 'AP');--> statement-breakpoint
CREATE TYPE "public"."agent_client_description" AS ENUM('strategicDataDriven', 'calmSteady', 'warmRelational', 'efficientDecisive');--> statement-breakpoint
CREATE TYPE "public"."agent_commission_approach" AS ENUM('proactiveFixed', 'proactiveOpen', 'reactiveFixed', 'reactiveOpen');--> statement-breakpoint
CREATE TYPE "public"."agent_communication_frequency" AS ENUM('scheduled', 'milestones', 'clientLed');--> statement-breakpoint
CREATE TYPE "public"."agent_difficult_deal_instinct" AS ENUM('factsFast', 'slowItDown', 'takeControl', 'deEscalateFirst');--> statement-breakpoint
CREATE TYPE "public"."agent_price_bucket" AS ENUM('under400k', '400kTo750k', '750kTo1_5m', '1_5mPlus');--> statement-breakpoint
CREATE TYPE "public"."agent_response_time" AS ENUM('within10Min', 'within30Min', 'fewHours', 'within24Hours');--> statement-breakpoint
CREATE TYPE "public"."agent_unrepresented_buyer_approach" AS ENUM('referSeparateBrokerage', 'representSellerOnly', 'anotherAgentInBrokerage');--> statement-breakpoint
CREATE TYPE "public"."average_transactions" AS ENUM('0-5', '6-15', '16-30', '30+');--> statement-breakpoint
CREATE TYPE "public"."best_client_type" AS ENUM('firstTime', 'moveUp', 'relocation', 'luxury', 'investor', 'landMultiFamily', 'seller', 'condoTownhome', 'other');--> statement-breakpoint
CREATE TYPE "public"."buyer_bidding_war_response" AS ENUM('factsOptions', 'space', 'reassurance', 'calmPresence');--> statement-breakpoint
CREATE TYPE "public"."buyer_decision_making_need" AS ENUM('numbersData', 'timeAndSpace', 'trustedPerspective', 'gutFeeling');--> statement-breakpoint
CREATE TYPE "public"."buyer_experience_level" AS ENUM('firstTime', 'experienced', 'veryExperienced');--> statement-breakpoint
CREATE TYPE "public"."buyer_ideal_agent_relationship" AS ENUM('trustedAdvisor', 'thinkingPartner', 'skilledExecutor');--> statement-breakpoint
CREATE TYPE "public"."commission_comfort" AS ENUM('negotiate', 'openOptions', 'payFairRate', 'dontUnderstand');--> statement-breakpoint
CREATE TYPE "public"."involvement_level" AS ENUM('veryInvolved', 'keyDetails', 'handsOff');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('draft', 'essentials_submitted', 'active', 'enriched');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('singleFamily', 'condoTownhome', 'multiFamily', 'land');--> statement-breakpoint
CREATE TYPE "public"."quick_communication_channel" AS ENUM('text', 'phone', 'either');--> statement-breakpoint
CREATE TYPE "public"."representation_side" AS ENUM('buyer', 'seller', 'both');--> statement-breakpoint
CREATE TYPE "public"."response_time_expectation" AS ENUM('within10Min', 'within30Min', 'fewHours', 'within24Hours');--> statement-breakpoint
CREATE TYPE "public"."seller_agent_silence_preference" AS ENUM('scheduled', 'milestones', 'clientLed');--> statement-breakpoint
CREATE TYPE "public"."seller_home_connection" AS ENUM('asset', 'goodMemories', 'partOfIdentity', 'complicated');--> statement-breakpoint
CREATE TYPE "public"."seller_representation_preference" AS ENUM('broadConnections', 'exclusiveRepresentationOnly');--> statement-breakpoint
CREATE TYPE "public"."seller_sale_motivation" AS ENUM('lifestyleChange', 'relocation', 'financialPressure', 'rightTime', 'majorTransition', 'other');--> statement-breakpoint
CREATE TYPE "public"."seller_successful_sale_looks_like" AS ENUM('maximumPrice', 'strongPriceSmoothProcess', 'speedCertainty', 'mustCloseByDate');--> statement-breakpoint
CREATE TYPE "public"."timeline" AS ENUM('exploring', '1month', '2months', '3months', '4months', '5months', '6months', '7months', '8months', '9months', '10months', '11months', '12monthsPlus');--> statement-breakpoint
CREATE TYPE "public"."update_delivery_method" AS ENUM('email', 'textWithAttachments', 'phoneThenEmailRecap');--> statement-breakpoint
CREATE TYPE "public"."years_licensed" AS ENUM('0-2', '3-5', '6-10', '10+');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profile_zips" (
	"id" text PRIMARY KEY NOT NULL,
	"city_zip_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"profile_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"representation_side" "representation_side" NOT NULL,
	"city_id" text NOT NULL,
	"typical_price_range" "agent_price_bucket" NOT NULL,
	"best_client_types" "best_client_type"[] DEFAULT '{}' NOT NULL,
	"not_fit_for" text[] DEFAULT '{}' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"brokerage_name" text NOT NULL,
	"email" text,
	"phone" text,
	"business_address" text,
	"license_number_state" text NOT NULL,
	"years_licensed" "years_licensed",
	"average_transactions" "average_transactions",
	"employment_status" text,
	"license_proof" text,
	"client_description" "agent_client_description" NOT NULL,
	"communication_frequency" "agent_communication_frequency" NOT NULL,
	"quick_communication_channel" "quick_communication_channel" NOT NULL,
	"update_delivery_method" "update_delivery_method" NOT NULL,
	"difficult_deal_instinct" "agent_difficult_deal_instinct" NOT NULL,
	"response_time" "agent_response_time" NOT NULL,
	"commission_approach" "agent_commission_approach" NOT NULL,
	"unrepresented_buyer_approach" "agent_unrepresented_buyer_approach" NOT NULL,
	"use_pax_writer" boolean DEFAULT true NOT NULL,
	"license_attested" boolean DEFAULT false NOT NULL,
	"eo_insurance_status" text NOT NULL,
	"peace_pact_signed" boolean DEFAULT false NOT NULL,
	"peace_pact_signature" text NOT NULL,
	"peace_pact_signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" "us_postal_code" NOT NULL,
	"center_lat" double precision NOT NULL,
	"center_lng" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city_zips" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"zip" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_profile_zips" (
	"id" text PRIMARY KEY NOT NULL,
	"city_zip_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"profile_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" "client_role" NOT NULL,
	"status" "profile_status" DEFAULT 'draft' NOT NULL,
	"city_id" text NOT NULL,
	"timeline" timeline NOT NULL,
	"price_min" integer NOT NULL,
	"price_max" integer NOT NULL,
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
	CONSTRAINT "client_profiles_id_role_index" UNIQUE("id","role"),
	CONSTRAINT "client_profiles_price_range_check" CHECK ("price_min" >= 0 AND "price_max" <= 2000000 AND "price_min" <= "price_max")
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
	CONSTRAINT "seller_details_role_check" CHECK ("seller_details"."role" = 'seller')
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key" "entitlement_key" NOT NULL,
	"source" "entitlement_source" NOT NULL,
	"stripe_customer_id" text,
	"stripe_payment_intent_id" text,
	"stripe_subscription_id" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profile_zips" ADD CONSTRAINT "agent_profile_zips_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."agent_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profile_zips" ADD CONSTRAINT "agent_profile_zips_city_zip_id_fk" FOREIGN KEY ("city_zip_id") REFERENCES "public"."city_zips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_details" ADD CONSTRAINT "buyer_details_profile_role_fk" FOREIGN KEY ("client_profile_id","role") REFERENCES "public"."client_profiles"("id","role") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_zips" ADD CONSTRAINT "city_zips_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile_zips" ADD CONSTRAINT "client_profile_zips_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile_zips" ADD CONSTRAINT "client_profile_zips_city_zip_id_fk" FOREIGN KEY ("city_zip_id") REFERENCES "public"."city_zips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_details" ADD CONSTRAINT "seller_details_profile_role_fk" FOREIGN KEY ("client_profile_id","role") REFERENCES "public"."client_profiles"("id","role") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_index" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_index" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_profile_zips_profile_id_city_zip_id_index" ON "agent_profile_zips" USING btree ("profile_id","city_zip_id");--> statement-breakpoint
CREATE INDEX "agent_profile_zips_profile_id_index" ON "agent_profile_zips" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_profiles_user_id_index" ON "agent_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_name_state_index" ON "cities" USING btree ("name","state");--> statement-breakpoint
CREATE INDEX "cities_state_index" ON "cities" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX "city_zips_zip_unique" ON "city_zips" USING btree ("zip");--> statement-breakpoint
CREATE UNIQUE INDEX "client_profile_zips_profile_id_city_zip_id_index" ON "client_profile_zips" USING btree ("profile_id","city_zip_id");--> statement-breakpoint
CREATE INDEX "client_profile_zips_profile_id_index" ON "client_profile_zips" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_profiles_user_role_index" ON "client_profiles" USING btree ("user_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_index" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_index" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_entitlements_user_id_index" ON "user_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_entitlements_user_key_index" ON "user_entitlements" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "verification_identifier_index" ON "verification" USING btree ("identifier");