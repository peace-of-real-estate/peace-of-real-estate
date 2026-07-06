-- Signup only inserts a profile row once every question is answered, so the
-- questionnaire columns become NOT NULL. Rows from earlier question sets get
-- a neutral default for unanswered questions; rows missing essentials that
-- cannot be invented (location, price, property types) are removed.

-- buyer_profiles
DELETE FROM "buyer_profiles"
WHERE "state" IS NULL
	OR "city" IS NULL
	OR "price_range" IS NULL
	OR "property_types" IS NULL;

UPDATE "buyer_profiles" SET
	"timeline" = COALESCE("timeline", 'exploring'),
	"involvement_level" = COALESCE("involvement_level", 'keyDetails'),
	"quick_communication_channel" = COALESCE("quick_communication_channel", 'either'),
	"update_delivery_method" = COALESCE("update_delivery_method", 'email'),
	"commission_comfort" = COALESCE("commission_comfort", 'openOptions'),
	"response_time_expectation" = COALESCE("response_time_expectation", 'fewHours'),
	"experience_level" = COALESCE("experience_level", 'experienced'),
	"ideal_agent_relationship" = COALESCE("ideal_agent_relationship", 'trustedAdvisor'),
	"decision_making_need" = COALESCE("decision_making_need", 'trustedPerspective'),
	"bidding_war_response" = COALESCE("bidding_war_response", 'factsOptions');

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
	OR "price_range" IS NULL
	OR "property_types" IS NULL;

UPDATE "seller_profiles" SET
	"timeline" = COALESCE("timeline", 'exploring'),
	"involvement_level" = COALESCE("involvement_level", 'keepMeInformed'),
	"quick_communication_channel" = COALESCE("quick_communication_channel", 'either'),
	"update_delivery_method" = COALESCE("update_delivery_method", 'email'),
	"commission_comfort" = COALESCE("commission_comfort", 'openOptions'),
	"response_time_expectation" = COALESCE("response_time_expectation", 'fewHours'),
	"sale_motivation" = COALESCE("sale_motivation", 'rightTime'),
	"successful_sale_looks_like" = COALESCE("successful_sale_looks_like", 'strongPriceSmoothProcess'),
	"agent_delivery_expectations" = COALESCE("agent_delivery_expectations", '{honestStraightforward}'),
	"home_connection" = COALESCE("home_connection", 'goodMemories'),
	"agent_silence_preference" = COALESCE("agent_silence_preference", 'milestones'),
	"representation_preference" = COALESCE("representation_preference", 'exclusiveRepresentationOnly');

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
UPDATE "agent_profiles" SET
	"client_description" = COALESCE("client_description", 'calmSteady'),
	"communication_frequency" = COALESCE("communication_frequency", 'milestones'),
	"quick_communication_channel" = COALESCE("quick_communication_channel", 'either'),
	"update_delivery_method" = COALESCE("update_delivery_method", 'email'),
	"difficult_deal_instinct" = COALESCE("difficult_deal_instinct", 'deEscalateFirst'),
	"response_time" = COALESCE("response_time", 'fewHours'),
	"commission_approach" = COALESCE("commission_approach", 'proactiveOpen'),
	"unrepresented_buyer_approach" = COALESCE("unrepresented_buyer_approach", 'referSeparateBrokerage');

ALTER TABLE "agent_profiles"
	ALTER COLUMN "client_description" SET NOT NULL,
	ALTER COLUMN "communication_frequency" SET NOT NULL,
	ALTER COLUMN "quick_communication_channel" SET NOT NULL,
	ALTER COLUMN "update_delivery_method" SET NOT NULL,
	ALTER COLUMN "difficult_deal_instinct" SET NOT NULL,
	ALTER COLUMN "response_time" SET NOT NULL,
	ALTER COLUMN "commission_approach" SET NOT NULL,
	ALTER COLUMN "unrepresented_buyer_approach" SET NOT NULL;
