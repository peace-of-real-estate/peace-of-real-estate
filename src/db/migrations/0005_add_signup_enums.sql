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
ALTER TABLE "agent_profiles" ALTER COLUMN "representation_side" SET DATA TYPE "public"."representation_side";--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "best_client_types" SET DATA TYPE "public"."best_client_type"[];--> statement-breakpoint
ALTER TABLE "agent_profiles" ALTER COLUMN "best_client_types" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "status" SET DATA TYPE "public"."profile_status";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "state" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "city" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "timeline" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "price_range" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "property_types" SET DATA TYPE "public"."property_type"[];--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "property_types" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "experience_level" SET DATA TYPE "public"."buyer_experience_level";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "experience_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "involvement_level" SET DATA TYPE "public"."involvement_level";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "involvement_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "commission_comfort" SET DATA TYPE "public"."commission_comfort";--> statement-breakpoint
ALTER TABLE "buyer_profiles" ALTER COLUMN "commission_comfort" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "status" SET DATA TYPE "public"."profile_status";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "state" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "city" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "timeline" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "price_range" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "property_types" SET DATA TYPE "public"."property_type"[];--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "property_types" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "involvement_level" SET DATA TYPE "public"."involvement_level";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "involvement_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "representation_preference" SET DATA TYPE "public"."seller_representation_preference";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "representation_preference" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "commission_comfort" SET DATA TYPE "public"."commission_comfort";--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "commission_comfort" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "client_description" "agent_client_description" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "communication_frequency" "agent_communication_frequency" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "quick_communication_channel" "quick_communication_channel" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "update_delivery_method" "update_delivery_method" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "difficult_deal_instinct" "agent_difficult_deal_instinct" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "response_time" "agent_response_time" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "commission_approach" "agent_commission_approach" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "unrepresented_buyer_approach" "agent_unrepresented_buyer_approach" NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "quick_communication_channel" "quick_communication_channel" NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "update_delivery_method" "update_delivery_method" NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "response_time_expectation" "response_time_expectation" NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "ideal_agent_relationship" "buyer_ideal_agent_relationship" NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "decision_making_need" "buyer_decision_making_need" NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "bidding_war_response" "buyer_bidding_war_response" NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "quick_communication_channel" "quick_communication_channel" NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "update_delivery_method" "update_delivery_method" NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "response_time_expectation" "response_time_expectation" NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "sale_motivation" "seller_sale_motivation" NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "successful_sale_looks_like" "seller_successful_sale_looks_like" NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "agent_delivery_expectations" "seller_agent_delivery_expectations"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "home_connection" "seller_home_connection" NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "agent_silence_preference" "seller_agent_silence_preference" NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_profiles" DROP COLUMN "estimated_home_value";--> statement-breakpoint
ALTER TABLE "buyer_profiles" DROP COLUMN "preferred_contact_method";--> statement-breakpoint
ALTER TABLE "buyer_profiles" DROP COLUMN "representation_preference";--> statement-breakpoint
ALTER TABLE "seller_profiles" DROP COLUMN "estimated_home_value";--> statement-breakpoint
ALTER TABLE "seller_profiles" DROP COLUMN "experience_level";--> statement-breakpoint
ALTER TABLE "seller_profiles" DROP COLUMN "preferred_contact_method";