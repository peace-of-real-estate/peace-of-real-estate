-- buyer_profiles: update questionnaire columns
ALTER TABLE "buyer_profiles"
	DROP COLUMN IF EXISTS "preferred_contact_method",
	ADD COLUMN IF NOT EXISTS "quick_communication_channel" text,
	ADD COLUMN IF NOT EXISTS "update_delivery_method" text,
	ADD COLUMN IF NOT EXISTS "response_time_expectation" text,
	ADD COLUMN IF NOT EXISTS "ideal_agent_relationship" text,
	ADD COLUMN IF NOT EXISTS "decision_making_need" text,
	ADD COLUMN IF NOT EXISTS "bidding_war_response" text;

-- seller_profiles: update questionnaire columns
ALTER TABLE "seller_profiles"
	DROP COLUMN IF EXISTS "preferred_contact_method",
	ADD COLUMN IF NOT EXISTS "quick_communication_channel" text,
	ADD COLUMN IF NOT EXISTS "update_delivery_method" text,
	ADD COLUMN IF NOT EXISTS "response_time_expectation" text,
	ADD COLUMN IF NOT EXISTS "sale_motivation" text,
	ADD COLUMN IF NOT EXISTS "successful_sale_looks_like" text,
	ADD COLUMN IF NOT EXISTS "agent_delivery_expectations" text[],
	ADD COLUMN IF NOT EXISTS "home_connection" text,
	ADD COLUMN IF NOT EXISTS "agent_silence_preference" text;

-- agent_profiles: add work-style questionnaire columns
ALTER TABLE "agent_profiles"
	ADD COLUMN IF NOT EXISTS "client_description" text,
	ADD COLUMN IF NOT EXISTS "communication_frequency" text,
	ADD COLUMN IF NOT EXISTS "quick_communication_channel" text,
	ADD COLUMN IF NOT EXISTS "update_delivery_method" text,
	ADD COLUMN IF NOT EXISTS "difficult_deal_instinct" text,
	ADD COLUMN IF NOT EXISTS "response_time" text,
	ADD COLUMN IF NOT EXISTS "commission_approach" text,
	ADD COLUMN IF NOT EXISTS "unrepresented_buyer_approach" text;
