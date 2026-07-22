CREATE TYPE "public"."introduction_notification_kind" AS ENUM('sent', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."introduction_status" AS ENUM('pending', 'accepted', 'declined', 'withdrawn', 'connected');--> statement-breakpoint
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
	CONSTRAINT "introductions_closed_data_check" CHECK ("introductions"."status" NOT IN ('declined', 'withdrawn') OR ("introductions"."data" ? 'closedAt' AND NOT ("introductions"."data" ? 'connectedAt'))),
	CONSTRAINT "introductions_connected_data_check" CHECK ("introductions"."status" <> 'connected' OR ("introductions"."data" ? 'acceptedAt' AND "introductions"."data" ? 'connectedAt' AND NOT ("introductions"."data" ? 'closedAt')))
);
--> statement-breakpoint
ALTER TABLE "connection_notification_jobs" ADD CONSTRAINT "connection_notification_jobs_introduction_id_fk" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intro_access_windows" ADD CONSTRAINT "intro_access_windows_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introduction_notification_jobs" ADD CONSTRAINT "introduction_notification_jobs_introduction_id_fk" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_client_profile_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_agent_profile_id_fk" FOREIGN KEY ("agent_profile_id") REFERENCES "public"."agent_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "intro_access_windows_profile_index" ON "intro_access_windows" USING btree ("client_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intro_access_windows_payment_intent_index" ON "intro_access_windows" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "introduction_notification_jobs_intro_kind_index" ON "introduction_notification_jobs" USING btree ("introduction_id","kind");--> statement-breakpoint
CREATE INDEX "introduction_notification_jobs_pending_index" ON "introduction_notification_jobs" USING btree ("kind") WHERE "introduction_notification_jobs"."sent_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "introductions_active_pair_index" ON "introductions" USING btree ("agent_profile_id","client_profile_id") WHERE "introductions"."status" in ('pending', 'accepted', 'connected');--> statement-breakpoint
CREATE INDEX "introductions_client_active_index" ON "introductions" USING btree ("client_profile_id") WHERE "introductions"."status" in ('pending', 'accepted');--> statement-breakpoint
CREATE INDEX "introductions_client_created_index" ON "introductions" USING btree ("client_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "introductions_agent_status_index" ON "introductions" USING btree ("agent_profile_id","status");