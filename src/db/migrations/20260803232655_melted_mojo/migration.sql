CREATE TABLE "intro_checkout_reservations" (
	"id" text PRIMARY KEY,
	"client_profile_id" text NOT NULL,
	"stripe_session_id" text,
	"selected_introduction_ids" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intro_unlock_fulfillments" (
	"stripe_payment_intent_id" text PRIMARY KEY,
	"client_profile_id" text,
	"fulfilled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "intro_checkout_reservations_profile_index" ON "intro_checkout_reservations" ("client_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_checkout_reservations_session_index" ON "intro_checkout_reservations" ("stripe_session_id");--> statement-breakpoint
ALTER TABLE "intro_checkout_reservations" ADD CONSTRAINT "intro_checkout_reservations_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "intro_unlock_fulfillments" ADD CONSTRAINT "intro_unlock_fulfillments_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE SET NULL;