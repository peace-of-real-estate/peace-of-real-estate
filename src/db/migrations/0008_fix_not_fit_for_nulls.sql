ALTER TABLE "agent_profiles" ALTER COLUMN "not_fit_for" SET DATA TYPE text[] USING "not_fit_for"::text[];--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "not_fit_for" SET DEFAULT '{}';--> statement-breakpoint
UPDATE "agent_profiles" SET "not_fit_for" = '{}' WHERE "not_fit_for" IS NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_not_fit_for_notnull" CHECK ("not_fit_for" IS NOT NULL) NOT VALID;--> statement-breakpoint
ALTER TABLE "agent_profiles" VALIDATE CONSTRAINT "agent_profiles_not_fit_for_notnull";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "not_fit_for" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP CONSTRAINT "agent_profiles_not_fit_for_notnull";--> statement-breakpoint