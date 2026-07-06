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
	"representation_side" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"typical_price_range" text NOT NULL,
	"best_client_types" text[] DEFAULT '{}' NOT NULL,
	"not_fit_for" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"brokerage_name" text NOT NULL,
	"email" text,
	"phone" text,
	"business_address" text,
	"billing_address" text,
	"license_number_state" text NOT NULL,
	"zip_codes" text[] DEFAULT '{}' NOT NULL,
	"years_licensed" text,
	"average_transactions" text,
	"employment_status" text,
	"license_proof" text,
	"use_pax_writer" boolean DEFAULT true NOT NULL,
	"license_attested" boolean DEFAULT false NOT NULL,
	"eo_insurance_status" text NOT NULL,
	"peace_pact_signed" boolean DEFAULT false NOT NULL,
	"peace_pact_signature" text NOT NULL,
	"peace_pact_signed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "agent_profiles_representation_side_check" CHECK ("agent_profiles"."representation_side" in ('buying', 'selling', 'both'))
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"center_lat" text NOT NULL,
	"center_lng" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city_zips" (
	"id" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumer_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"intent" text NOT NULL,
	"state" text,
	"city" text,
	"zip_codes" text[] DEFAULT '{}' NOT NULL,
	"timeline" text,
	"price_range" text,
	"estimated_home_value" text,
	"property_types" text[],
	"experience_level" text,
	"preferred_contact_method" text,
	"involvement_level" text,
	"representation_preference" text,
	"commission_comfort" text,
	"match_priorities" text[],
	"match_details" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "consumer_profiles_status_check" CHECK ("consumer_profiles"."status" in ('draft', 'essentials_submitted', 'active', 'enriched')),
	CONSTRAINT "consumer_profiles_intent_check" CHECK ("consumer_profiles"."intent" in ('buying', 'selling', 'both'))
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
	"key" text NOT NULL,
	"source" text NOT NULL,
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
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_profiles" ADD CONSTRAINT "consumer_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
CREATE UNIQUE INDEX "consumer_profiles_user_id_index" ON "consumer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_index" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_index" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_entitlements_user_id_index" ON "user_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_entitlements_user_key_index" ON "user_entitlements" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "verification_identifier_index" ON "verification" USING btree ("identifier");