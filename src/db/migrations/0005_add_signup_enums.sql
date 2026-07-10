CREATE TYPE "public"."profile_status" AS ENUM ('draft', 'essentials_submitted', 'active', 'enriched');
--> statement-breakpoint
CREATE TYPE "public"."representation_side" AS ENUM ('buying', 'selling', 'both');
--> statement-breakpoint
CREATE TYPE "public"."buyer_experience_level" AS ENUM ('firstTime', 'experienced', 'veryExperienced');
--> statement-breakpoint
CREATE TYPE "public"."buyer_ideal_agent_relationship" AS ENUM ('trustedAdvisor', 'thinkingPartner', 'skilledExecutor');
--> statement-breakpoint
CREATE TYPE "public"."buyer_decision_making_need" AS ENUM ('numbersData', 'timeAndSpace', 'trustedPerspective', 'gutFeeling');
--> statement-breakpoint
CREATE TYPE "public"."buyer_bidding_war_response" AS ENUM ('factsOptions', 'space', 'reassurance', 'calmPresence');
--> statement-breakpoint
CREATE TYPE "public"."quick_communication_channel" AS ENUM ('text', 'phone', 'either');
--> statement-breakpoint
CREATE TYPE "public"."update_delivery_method" AS ENUM ('email', 'textWithAttachments', 'phoneThenEmailRecap');
--> statement-breakpoint
CREATE TYPE "public"."involvement_level" AS ENUM ('veryInvolved', 'keyDetails', 'handsOff');
--> statement-breakpoint
CREATE TYPE "public"."response_time_expectation" AS ENUM ('within10Min', 'within30Min', 'fewHours', 'within24Hours');
--> statement-breakpoint
CREATE TYPE "public"."commission_comfort" AS ENUM ('negotiate', 'openOptions', 'payFairRate', 'dontUnderstand');
--> statement-breakpoint
CREATE TYPE "public"."seller_sale_motivation" AS ENUM ('lifestyleChange', 'relocation', 'financialPressure', 'rightTime', 'majorTransition', 'other');
--> statement-breakpoint
CREATE TYPE "public"."seller_successful_sale_looks_like" AS ENUM ('maximumPrice', 'strongPriceSmoothProcess', 'speedCertainty', 'mustCloseByDate');
--> statement-breakpoint
CREATE TYPE "public"."seller_agent_delivery_expectations" AS ENUM ('pricedRight', 'greatMarketing', 'greatNegotiatedOutcome', 'reachableResponsive', 'keptItCalm', 'honestStraightforward');
--> statement-breakpoint
CREATE TYPE "public"."seller_home_connection" AS ENUM ('asset', 'goodMemories', 'partOfIdentity', 'complicated');
--> statement-breakpoint
CREATE TYPE "public"."seller_agent_silence_preference" AS ENUM ('scheduled', 'milestones', 'clientLed');
--> statement-breakpoint
CREATE TYPE "public"."seller_representation_preference" AS ENUM ('broadConnections', 'exclusiveRepresentationOnly');
--> statement-breakpoint
CREATE TYPE "public"."agent_client_description" AS ENUM ('strategicDataDriven', 'calmSteady', 'warmRelational', 'efficientDecisive');
--> statement-breakpoint
CREATE TYPE "public"."agent_communication_frequency" AS ENUM ('scheduled', 'milestones', 'clientLed');
--> statement-breakpoint
CREATE TYPE "public"."agent_difficult_deal_instinct" AS ENUM ('factsFast', 'slowItDown', 'takeControl', 'deEscalateFirst');
--> statement-breakpoint
CREATE TYPE "public"."agent_response_time" AS ENUM ('within10Min', 'within30Min', 'fewHours', 'within24Hours');
--> statement-breakpoint
CREATE TYPE "public"."agent_commission_approach" AS ENUM ('proactiveFixed', 'proactiveOpen', 'reactiveFixed', 'reactiveOpen');
--> statement-breakpoint
CREATE TYPE "public"."agent_unrepresented_buyer_approach" AS ENUM ('referSeparateBrokerage', 'representSellerOnly', 'anotherAgentInBrokerage');
--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM ('singleFamily', 'condoTownhome', 'multiFamily', 'land');
--> statement-breakpoint
CREATE TYPE "public"."best_client_type" AS ENUM ('firstTime', 'moveUp', 'relocation', 'luxury', 'investor', 'landMultiFamily', 'seller', 'condoTownhome', 'other');
--> statement-breakpoint
UPDATE "seller_profiles" SET "involvement_level" = 'keyDetails' WHERE "involvement_level" = 'keepMeInformed';
--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP CONSTRAINT IF EXISTS "agent_profiles_representation_side_check";--> statement-breakpoint
ALTER TABLE "buyer_profiles" DROP CONSTRAINT IF EXISTS "buyer_profiles_status_check";--> statement-breakpoint
ALTER TABLE "seller_profiles" DROP CONSTRAINT IF EXISTS "seller_profiles_status_check";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "best_client_types" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "representation_side" SET DATA TYPE "public"."representation_side" USING "representation_side"::"public"."representation_side";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "best_client_types" SET DATA TYPE "public"."best_client_type"[] USING "best_client_types"::"public"."best_client_type"[];--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "client_description" SET DATA TYPE "public"."agent_client_description" USING "client_description"::"public"."agent_client_description";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "communication_frequency" SET DATA TYPE "public"."agent_communication_frequency" USING "communication_frequency"::"public"."agent_communication_frequency";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "quick_communication_channel" SET DATA TYPE "public"."quick_communication_channel" USING "quick_communication_channel"::"public"."quick_communication_channel";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "update_delivery_method" SET DATA TYPE "public"."update_delivery_method" USING "update_delivery_method"::"public"."update_delivery_method";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "difficult_deal_instinct" SET DATA TYPE "public"."agent_difficult_deal_instinct" USING "difficult_deal_instinct"::"public"."agent_difficult_deal_instinct";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "response_time" SET DATA TYPE "public"."agent_response_time" USING "response_time"::"public"."agent_response_time";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "commission_approach" SET DATA TYPE "public"."agent_commission_approach" USING "commission_approach"::"public"."agent_commission_approach";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "unrepresented_buyer_approach" SET DATA TYPE "public"."agent_unrepresented_buyer_approach" USING "unrepresented_buyer_approach"::"public"."agent_unrepresented_buyer_approach";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "status" SET DATA TYPE "public"."profile_status" USING "status"::"public"."profile_status";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "property_types" SET DATA TYPE "public"."property_type"[] USING "property_types"::"public"."property_type"[];--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "experience_level" SET DATA TYPE "public"."buyer_experience_level" USING "experience_level"::"public"."buyer_experience_level";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "involvement_level" SET DATA TYPE "public"."involvement_level" USING "involvement_level"::"public"."involvement_level";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "commission_comfort" SET DATA TYPE "public"."commission_comfort" USING "commission_comfort"::"public"."commission_comfort";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "quick_communication_channel" SET DATA TYPE "public"."quick_communication_channel" USING "quick_communication_channel"::"public"."quick_communication_channel";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "update_delivery_method" SET DATA TYPE "public"."update_delivery_method" USING "update_delivery_method"::"public"."update_delivery_method";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "response_time_expectation" SET DATA TYPE "public"."response_time_expectation" USING "response_time_expectation"::"public"."response_time_expectation";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "ideal_agent_relationship" SET DATA TYPE "public"."buyer_ideal_agent_relationship" USING "ideal_agent_relationship"::"public"."buyer_ideal_agent_relationship";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "decision_making_need" SET DATA TYPE "public"."buyer_decision_making_need" USING "decision_making_need"::"public"."buyer_decision_making_need";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "bidding_war_response" SET DATA TYPE "public"."buyer_bidding_war_response" USING "bidding_war_response"::"public"."buyer_bidding_war_response";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "status" SET DATA TYPE "public"."profile_status" USING "status"::"public"."profile_status";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "property_types" SET DATA TYPE "public"."property_type"[] USING "property_types"::"public"."property_type"[];--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "involvement_level" SET DATA TYPE "public"."involvement_level" USING "involvement_level"::"public"."involvement_level";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "representation_preference" SET DATA TYPE "public"."seller_representation_preference" USING "representation_preference"::"public"."seller_representation_preference";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "commission_comfort" SET DATA TYPE "public"."commission_comfort" USING "commission_comfort"::"public"."commission_comfort";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "quick_communication_channel" SET DATA TYPE "public"."quick_communication_channel" USING "quick_communication_channel"::"public"."quick_communication_channel";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "update_delivery_method" SET DATA TYPE "public"."update_delivery_method" USING "update_delivery_method"::"public"."update_delivery_method";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "response_time_expectation" SET DATA TYPE "public"."response_time_expectation" USING "response_time_expectation"::"public"."response_time_expectation";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "sale_motivation" SET DATA TYPE "public"."seller_sale_motivation" USING "sale_motivation"::"public"."seller_sale_motivation";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "successful_sale_looks_like" SET DATA TYPE "public"."seller_successful_sale_looks_like" USING "successful_sale_looks_like"::"public"."seller_successful_sale_looks_like";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "agent_delivery_expectations" SET DATA TYPE "public"."seller_agent_delivery_expectations"[] USING "agent_delivery_expectations"::"public"."seller_agent_delivery_expectations"[];--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "home_connection" SET DATA TYPE "public"."seller_home_connection" USING "home_connection"::"public"."seller_home_connection";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "agent_silence_preference" SET DATA TYPE "public"."seller_agent_silence_preference" USING "agent_silence_preference"::"public"."seller_agent_silence_preference";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "best_client_types" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint