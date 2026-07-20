CREATE TYPE "public"."client_role" AS ENUM('buyer', 'seller');--> statement-breakpoint
CREATE TYPE "public"."entitlement_key" AS ENUM('client_lifetime_premium', 'agent_subscription');--> statement-breakpoint
CREATE TYPE "public"."entitlement_source" AS ENUM('manual', 'stripe_checkout', 'stripe_subscription');--> statement-breakpoint
CREATE TYPE "public"."introduction_notification_kind" AS ENUM('sent', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."introduction_status" AS ENUM('pending', 'accepted', 'declined', 'withdrawn', 'connected');--> statement-breakpoint
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
CREATE TYPE "public"."representation_side" AS ENUM('buyers', 'sellers', 'both');--> statement-breakpoint
CREATE TYPE "public"."response_time_expectation" AS ENUM('within10Min', 'within30Min', 'fewHours', 'within24Hours');--> statement-breakpoint
CREATE TYPE "public"."seller_agent_delivery_expectations" AS ENUM('pricedRight', 'greatMarketing', 'greatNegotiatedOutcome', 'reachableResponsive', 'keptItCalm', 'honestStraightforward');--> statement-breakpoint
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
CREATE TABLE "agent_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"representation_side" "representation_side" NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"typical_price_range" "agent_price_bucket" NOT NULL,
	"best_client_types" "best_client_type"[] DEFAULT '{}' NOT NULL,
	"not_fit_for" text[] DEFAULT '{}' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"brokerage_name" text NOT NULL,
	"email" text,
	"phone" text,
	"business_address" text,
	"billing_address" text,
	"license_number_state" text NOT NULL,
	"zip_codes" text[] DEFAULT '{}' NOT NULL,
	"city_center_latitude" double precision DEFAULT NULL,
	"city_center_longitude" double precision DEFAULT NULL,
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
	"city" text NOT NULL,
	"state" text NOT NULL,
	"center_lat" double precision NOT NULL,
	"center_lng" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city_zips" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "connection_notification_jobs" (
	"introduction_id" text PRIMARY KEY NOT NULL,
	"agent_sent_at" timestamp with time zone,
	"client_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intro_access_windows" (
	"id" text PRIMARY KEY NOT NULL,
	"client_profile_id" text NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "intro_access_windows_range_check" CHECK ("intro_access_windows"."ends_at" > "intro_access_windows"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "intro_checkout_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"client_profile_id" text NOT NULL,
	"stripe_session_id" text,
	"selected_introduction_ids" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intro_unlock_fulfillments" (
	"stripe_payment_intent_id" text PRIMARY KEY NOT NULL,
	"client_profile_id" text NOT NULL,
	"fulfilled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "introduction_notification_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"introduction_id" text NOT NULL,
	"kind" "introduction_notification_kind" NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "introductions" (
	"id" text PRIMARY KEY NOT NULL,
	"client_profile_id" text NOT NULL,
	"agent_profile_id" text NOT NULL,
	"status" "introduction_status" DEFAULT 'pending' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "introductions_pending_data_check" CHECK ("introductions"."status" <> 'pending' OR "introductions"."data" = '{}'::jsonb),
	CONSTRAINT "introductions_accepted_data_check" CHECK ("introductions"."status" <> 'accepted' OR ("introductions"."data" ? 'acceptedAt' AND NOT ("introductions"."data" ? 'connectedAt') AND NOT ("introductions"."data" ? 'closedAt'))),
	CONSTRAINT "introductions_connected_data_check" CHECK ("introductions"."status" <> 'connected' OR ("introductions"."data" ? 'acceptedAt' AND "introductions"."data" ? 'connectedAt' AND NOT ("introductions"."data" ? 'closedAt'))),
	CONSTRAINT "introductions_closed_data_check" CHECK ("introductions"."status" NOT IN ('declined', 'withdrawn') OR ("introductions"."data" ? 'closedAt' AND NOT ("introductions"."data" ? 'connectedAt')))
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
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_details" ADD CONSTRAINT "buyer_details_profile_role_fk" FOREIGN KEY ("client_profile_id","role") REFERENCES "public"."client_profiles"("id","role") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_zips" ADD CONSTRAINT "city_zips_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_notification_jobs" ADD CONSTRAINT "connection_notification_jobs_introduction_id_fk" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_access_windows" ADD CONSTRAINT "intro_access_windows_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_checkout_reservations" ADD CONSTRAINT "intro_checkout_reservations_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_unlock_fulfillments" ADD CONSTRAINT "intro_unlock_fulfillments_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introduction_notification_jobs" ADD CONSTRAINT "introduction_notification_jobs_introduction_id_fk" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_agent_profile_id_fk" FOREIGN KEY ("agent_profile_id") REFERENCES "public"."agent_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_details" ADD CONSTRAINT "seller_details_profile_role_fk" FOREIGN KEY ("client_profile_id","role") REFERENCES "public"."client_profiles"("id","role") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_index" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_index" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_provider_index" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_profiles_user_id_index" ON "agent_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_city_state_index" ON "cities" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "cities_state_index" ON "cities" USING btree ("state");--> statement-breakpoint
CREATE INDEX "city_zips_city_state_index" ON "city_zips" USING btree ("city","state");--> statement-breakpoint
CREATE UNIQUE INDEX "city_zips_city_state_zip_index" ON "city_zips" USING btree ("city","state","zip");--> statement-breakpoint
CREATE INDEX "city_zips_zip_index" ON "city_zips" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "city_zips_city_id_index" ON "city_zips" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_profiles_user_role_index" ON "client_profiles" USING btree ("user_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_access_windows_profile_index" ON "intro_access_windows" USING btree ("client_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_access_windows_payment_intent_index" ON "intro_access_windows" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_checkout_reservations_profile_index" ON "intro_checkout_reservations" USING btree ("client_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_checkout_reservations_session_index" ON "intro_checkout_reservations" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "introduction_notification_jobs_intro_kind_index" ON "introduction_notification_jobs" USING btree ("introduction_id","kind");--> statement-breakpoint
CREATE INDEX "introduction_notification_jobs_pending_index" ON "introduction_notification_jobs" USING btree ("kind") WHERE "introduction_notification_jobs"."sent_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "introductions_active_pair_index" ON "introductions" USING btree ("agent_profile_id","client_profile_id") WHERE "introductions"."status" in ('pending', 'accepted', 'connected');--> statement-breakpoint
CREATE INDEX "introductions_client_active_index" ON "introductions" USING btree ("client_profile_id") WHERE "introductions"."status" in ('pending', 'accepted');--> statement-breakpoint
CREATE INDEX "introductions_client_created_index" ON "introductions" USING btree ("client_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "introductions_agent_status_index" ON "introductions" USING btree ("agent_profile_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_index" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_index" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_entitlements_user_id_index" ON "user_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_entitlements_user_key_index" ON "user_entitlements" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "verification_identifier_index" ON "verification" USING btree ("identifier");