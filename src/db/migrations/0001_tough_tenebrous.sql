ALTER TABLE "agent_profile_zips" DROP CONSTRAINT "agent_profile_zips_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "agent_profile_zips" DROP CONSTRAINT "agent_profile_zips_city_zip_id_fk";
--> statement-breakpoint
ALTER TABLE "client_profile_zips" DROP CONSTRAINT "client_profile_zips_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "client_profile_zips" DROP CONSTRAINT "client_profile_zips_city_zip_id_fk";
--> statement-breakpoint
ALTER TABLE "agent_profile_zips" ADD COLUMN "city_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profile_zips" ADD COLUMN "city_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_id_city_id_unique" UNIQUE("id","city_id");--> statement-breakpoint
ALTER TABLE "city_zips" ADD CONSTRAINT "city_zips_id_city_id_unique" UNIQUE("id","city_id");--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_id_city_id_unique" UNIQUE("id","city_id");--> statement-breakpoint
ALTER TABLE "agent_profile_zips" ADD CONSTRAINT "agent_profile_zips_profile_city_fk" FOREIGN KEY ("profile_id","city_id") REFERENCES "public"."agent_profiles"("id","city_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profile_zips" ADD CONSTRAINT "agent_profile_zips_city_zip_city_fk" FOREIGN KEY ("city_zip_id","city_id") REFERENCES "public"."city_zips"("id","city_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile_zips" ADD CONSTRAINT "client_profile_zips_profile_city_fk" FOREIGN KEY ("profile_id","city_id") REFERENCES "public"."client_profiles"("id","city_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile_zips" ADD CONSTRAINT "client_profile_zips_city_zip_city_fk" FOREIGN KEY ("city_zip_id","city_id") REFERENCES "public"."city_zips"("id","city_id") ON DELETE no action ON UPDATE no action;
