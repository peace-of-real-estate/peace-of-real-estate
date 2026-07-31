CREATE TYPE "introduction_notification_kind" AS ENUM('sent', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "introduction_status" AS ENUM('pending', 'accepted', 'declined', 'withdrawn', 'connected');--> statement-breakpoint
CREATE TABLE "intro_access_windows" (
	"id" text PRIMARY KEY,
	"client_profile_id" text NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "intro_access_windows_range_check" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
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
CREATE TABLE "connection_notification_jobs" (
	"introduction_id" text PRIMARY KEY,
	"agent_sent_at" timestamp with time zone,
	"client_sent_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "introduction_notification_jobs" (
	"id" text PRIMARY KEY,
	"introduction_id" text NOT NULL,
	"kind" "introduction_notification_kind" NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "introductions" (
	"id" text PRIMARY KEY,
	"client_profile_id" text NOT NULL,
	"agent_profile_id" text NOT NULL,
	"status" "introduction_status" DEFAULT 'pending'::"introduction_status" NOT NULL,
	"accepted_at" timestamp with time zone,
	"connected_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "introductions_pending_data_check" CHECK ("status" <> 'pending' OR ("accepted_at" IS NULL AND "connected_at" IS NULL AND "closed_at" IS NULL)),
	CONSTRAINT "introductions_accepted_data_check" CHECK ("status" <> 'accepted' OR ("accepted_at" IS NOT NULL AND "connected_at" IS NULL AND "closed_at" IS NULL)),
	CONSTRAINT "introductions_closed_data_check" CHECK ("status" NOT IN ('declined', 'withdrawn') OR ("closed_at" IS NOT NULL AND "accepted_at" IS NULL AND "connected_at" IS NULL)),
	CONSTRAINT "introductions_connected_data_check" CHECK ("status" <> 'connected' OR ("accepted_at" IS NOT NULL AND "connected_at" IS NOT NULL AND "closed_at" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "match_priorities";--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "match_details";--> statement-breakpoint
CREATE UNIQUE INDEX "intro_access_windows_profile_index" ON "intro_access_windows" ("client_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_access_windows_payment_intent_index" ON "intro_access_windows" ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_checkout_reservations_profile_index" ON "intro_checkout_reservations" ("client_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_checkout_reservations_session_index" ON "intro_checkout_reservations" ("stripe_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "introduction_notification_jobs_intro_kind_index" ON "introduction_notification_jobs" ("introduction_id","kind");--> statement-breakpoint
CREATE INDEX "introduction_notification_jobs_pending_index" ON "introduction_notification_jobs" ("kind") WHERE "sent_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "introductions_active_pair_index" ON "introductions" ("agent_profile_id","client_profile_id") WHERE "status" in ('pending', 'accepted', 'connected');--> statement-breakpoint
CREATE INDEX "introductions_client_active_index" ON "introductions" ("client_profile_id") WHERE "status" in ('pending', 'accepted');--> statement-breakpoint
CREATE INDEX "introductions_client_created_index" ON "introductions" ("client_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "introductions_agent_status_index" ON "introductions" ("agent_profile_id","status");--> statement-breakpoint
ALTER TABLE "intro_access_windows" ADD CONSTRAINT "intro_access_windows_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "intro_checkout_reservations" ADD CONSTRAINT "intro_checkout_reservations_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "intro_unlock_fulfillments" ADD CONSTRAINT "intro_unlock_fulfillments_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "connection_notification_jobs" ADD CONSTRAINT "connection_notification_jobs_introduction_id_fk" FOREIGN KEY ("introduction_id") REFERENCES "introductions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "introduction_notification_jobs" ADD CONSTRAINT "introduction_notification_jobs_introduction_id_fk" FOREIGN KEY ("introduction_id") REFERENCES "introductions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_agent_profile_id_fk" FOREIGN KEY ("agent_profile_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE;