-- Signup only inserts a profile row once every question is answered, so the
-- questionnaire columns become NOT NULL. Rows from earlier question sets are
-- missing answers and are removed; those users redo signup.

-- buyer_profiles
DELETE FROM "buyer_profiles"
WHERE "state" IS NULL
	OR "city" IS NULL
	OR "timeline" IS NULL
	OR "price_range" IS NULL
	OR "property_types" IS NULL
	OR "involvement_level" IS NULL
	OR "quick_communication_channel" IS NULL
	OR "update_delivery_method" IS NULL
	OR "commission_comfort" IS NULL
	OR "response_time_expectation" IS NULL
	OR "experience_level" IS NULL
	OR "ideal_agent_relationship" IS NULL
	OR "decision_making_need" IS NULL
	OR "bidding_war_response" IS NULL;

ALTER TABLE "buyer_profiles"
	DROP COLUMN IF EXISTS "estimated_home_value",
	DROP COLUMN IF EXISTS "representation_preference",
	ALTER COLUMN "state" SET NOT NULL,
	ALTER COLUMN "city" SET NOT NULL,
	ALTER COLUMN "timeline" SET NOT NULL,
	ALTER COLUMN "price_range" SET NOT NULL,
	ALTER COLUMN "property_types" SET NOT NULL,
	ALTER COLUMN "involvement_level" SET NOT NULL,
	ALTER COLUMN "quick_communication_channel" SET NOT NULL,
	ALTER COLUMN "update_delivery_method" SET NOT NULL,
	ALTER COLUMN "commission_comfort" SET NOT NULL,
	ALTER COLUMN "response_time_expectation" SET NOT NULL,
	ALTER COLUMN "experience_level" SET NOT NULL,
	ALTER COLUMN "ideal_agent_relationship" SET NOT NULL,
	ALTER COLUMN "decision_making_need" SET NOT NULL,
	ALTER COLUMN "bidding_war_response" SET NOT NULL;

-- seller_profiles
DELETE FROM "seller_profiles"
WHERE "state" IS NULL
	OR "city" IS NULL
	OR "timeline" IS NULL
	OR "price_range" IS NULL
	OR "property_types" IS NULL
	OR "involvement_level" IS NULL
	OR "quick_communication_channel" IS NULL
	OR "update_delivery_method" IS NULL
	OR "commission_comfort" IS NULL
	OR "response_time_expectation" IS NULL
	OR "sale_motivation" IS NULL
	OR "successful_sale_looks_like" IS NULL
	OR "agent_delivery_expectations" IS NULL
	OR "home_connection" IS NULL
	OR "agent_silence_preference" IS NULL
	OR "representation_preference" IS NULL;

ALTER TABLE "seller_profiles"
	DROP COLUMN IF EXISTS "estimated_home_value",
	DROP COLUMN IF EXISTS "experience_level",
	ALTER COLUMN "state" SET NOT NULL,
	ALTER COLUMN "city" SET NOT NULL,
	ALTER COLUMN "timeline" SET NOT NULL,
	ALTER COLUMN "price_range" SET NOT NULL,
	ALTER COLUMN "property_types" SET NOT NULL,
	ALTER COLUMN "involvement_level" SET NOT NULL,
	ALTER COLUMN "quick_communication_channel" SET NOT NULL,
	ALTER COLUMN "update_delivery_method" SET NOT NULL,
	ALTER COLUMN "commission_comfort" SET NOT NULL,
	ALTER COLUMN "response_time_expectation" SET NOT NULL,
	ALTER COLUMN "sale_motivation" SET NOT NULL,
	ALTER COLUMN "successful_sale_looks_like" SET NOT NULL,
	ALTER COLUMN "agent_delivery_expectations" SET NOT NULL,
	ALTER COLUMN "home_connection" SET NOT NULL,
	ALTER COLUMN "agent_silence_preference" SET NOT NULL,
	ALTER COLUMN "representation_preference" SET NOT NULL;

-- agent_profiles
DELETE FROM "agent_profiles"
WHERE "client_description" IS NULL
	OR "communication_frequency" IS NULL
	OR "quick_communication_channel" IS NULL
	OR "update_delivery_method" IS NULL
	OR "difficult_deal_instinct" IS NULL
	OR "response_time" IS NULL
	OR "commission_approach" IS NULL
	OR "unrepresented_buyer_approach" IS NULL;

ALTER TABLE "agent_profiles"
	ALTER COLUMN "client_description" SET NOT NULL,
	ALTER COLUMN "communication_frequency" SET NOT NULL,
	ALTER COLUMN "quick_communication_channel" SET NOT NULL,
	ALTER COLUMN "update_delivery_method" SET NOT NULL,
	ALTER COLUMN "difficult_deal_instinct" SET NOT NULL,
	ALTER COLUMN "response_time" SET NOT NULL,
	ALTER COLUMN "commission_approach" SET NOT NULL,
	ALTER COLUMN "unrepresented_buyer_approach" SET NOT NULL;
