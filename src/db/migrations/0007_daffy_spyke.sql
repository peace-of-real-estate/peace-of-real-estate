ALTER TABLE "agent_profiles" ALTER COLUMN "not_fit_for" SET DATA TYPE text[] USING "not_fit_for"::text[];--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "not_fit_for" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "not_fit_for" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "city_center_latitude" real DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "city_center_longitude" real DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "city_center_latitude" real DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "city_center_longitude" real DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "city_center_latitude" real DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "city_center_longitude" real DEFAULT NULL;