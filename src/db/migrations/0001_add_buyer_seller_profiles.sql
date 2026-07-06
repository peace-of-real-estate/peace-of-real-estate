CREATE TABLE "buyer_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
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
	CONSTRAINT "buyer_profiles_status_check" CHECK ("buyer_profiles"."status" in ('draft', 'essentials_submitted', 'active', 'enriched'))
);
--> statement-breakpoint
CREATE TABLE "seller_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
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
	CONSTRAINT "seller_profiles_status_check" CHECK ("seller_profiles"."status" in ('draft', 'essentials_submitted', 'active', 'enriched'))
);
--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_profiles_user_id_index" ON "buyer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seller_profiles_user_id_index" ON "seller_profiles" USING btree ("user_id");