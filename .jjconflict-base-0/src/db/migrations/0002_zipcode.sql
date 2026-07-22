ALTER TABLE "agent_profiles" ALTER COLUMN "city_center_latitude" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "city_center_latitude" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "city_center_longitude" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "city_center_longitude" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "city_center_latitude" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "city_center_latitude" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "city_center_longitude" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "city_center_longitude" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "center_lat" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "center_lng" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "city_zips" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "city_center_latitude" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "city_center_latitude" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "city_center_longitude" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "city_center_longitude" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "city_zips" ADD COLUMN "city_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "city_zips" ADD CONSTRAINT "city_zips_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "city_zips_city_id_index" ON "city_zips" USING btree ("city_id");