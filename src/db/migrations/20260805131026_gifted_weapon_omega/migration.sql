CREATE TYPE "agent_commission_style" AS ENUM('openToNegotiating', 'walkThroughRate', 'rateIsSet');--> statement-breakpoint
CREATE TYPE "agent_decision_style" AS ENUM('theyLetMeLead', 'walkThroughFollow', 'middleGround', 'theirCall');--> statement-breakpoint
CREATE TYPE "agent_energy_focus" AS ENUM('fightHard', 'calm', 'moveFast', 'spotProblems', 'explainSteps', 'localKnowledge');--> statement-breakpoint
CREATE TYPE "buyer_experience" AS ENUM('firstTime', 'onceOrTwice', 'severalTimes');--> statement-breakpoint
CREATE TYPE "client_commission_plan" AS ENUM('negotiate', 'discussThenDecide', 'acceptRate');--> statement-breakpoint
CREATE TYPE "client_decision_style" AS ENUM('letThemLead', 'walkMeThrough', 'middleGround', 'finalCall');--> statement-breakpoint
CREATE TYPE "contact_style" AS ENUM('whenItMatters', 'regularCheckins', 'handsOn');--> statement-breakpoint
CREATE TYPE "enjoyed_client_type" AS ENUM('firstTimeBuyers', 'firstTimeSellers', 'moveUp', 'downsizers', 'relocating', 'experiencedLowMaintenance', 'luxury', 'investors', 'lifeChangeSellers');--> statement-breakpoint
CREATE TYPE "risk_comfort" AS ENUM('noRisk', 'lowRisk', 'moderateRisk', 'allIn');--> statement-breakpoint
CREATE TYPE "seller_motivation" AS ENUM('differentSize', 'relocating', 'lifeChange', 'rightTime');--> statement-breakpoint
CREATE TYPE "specialty" AS ENUM('vaMilitary', 'fhaDownPayment', 'assumableLoans', 'bridgeLoans', 'ownerFinancing', 'renovationLoans', 'exchange1031', 'reverseMortgage', 'investmentRental', 'newConstruction', 'shortSales', 'probateEstate', 'tenantOccupied', 'auction', 'multigenerational', 'seniors55Plus', 'relocationOutOfState', 'internationalBuyers');--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "enjoyed_clients" "enjoyed_client_type"[] DEFAULT '{}'::"enjoyed_client_type"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "energy_focus" "agent_energy_focus"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "client_decision_style" "agent_decision_style" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "client_contact_style" "contact_style" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "risk_advice_comfort" "risk_comfort" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "commission_style" "agent_commission_style" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD COLUMN "specialties" "specialty"[] DEFAULT '{}'::"specialty"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_details" ADD COLUMN "buying_experience" "buyer_experience" NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD COLUMN "decision_style" "client_decision_style" NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD COLUMN "contact_style" "contact_style" NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD COLUMN "risk_comfort" "risk_comfort" NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD COLUMN "commission_plan" "client_commission_plan" NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD COLUMN "situation_specialties" "specialty"[] DEFAULT '{}'::"specialty"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_details" ADD COLUMN "selling_motivation" "seller_motivation" NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "best_client_type";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "not_fit_for";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "client_description";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "communication_frequency";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "quick_communication_channel";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "update_delivery_method";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "difficult_deal_instinct";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "response_time";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "commission_approach";--> statement-breakpoint
ALTER TABLE "agent_profiles" DROP COLUMN "unrepresented_buyer_approach";--> statement-breakpoint
ALTER TABLE "buyer_details" DROP COLUMN "experience_level";--> statement-breakpoint
ALTER TABLE "buyer_details" DROP COLUMN "ideal_agent_relationship";--> statement-breakpoint
ALTER TABLE "buyer_details" DROP COLUMN "decision_making_need";--> statement-breakpoint
ALTER TABLE "buyer_details" DROP COLUMN "bidding_war_response";--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "quick_communication_channel";--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "update_delivery_method";--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "response_time_expectation";--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "involvement_level";--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "commission_comfort";--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "match_priorities";--> statement-breakpoint
ALTER TABLE "client_profiles" DROP COLUMN "match_details";--> statement-breakpoint
ALTER TABLE "seller_details" DROP COLUMN "sale_motivation";--> statement-breakpoint
ALTER TABLE "seller_details" DROP COLUMN "successful_sale_looks_like";--> statement-breakpoint
ALTER TABLE "seller_details" DROP COLUMN "home_connection";--> statement-breakpoint
ALTER TABLE "seller_details" DROP COLUMN "agent_silence_preference";--> statement-breakpoint
ALTER TABLE "seller_details" DROP COLUMN "representation_preference";--> statement-breakpoint
DROP TYPE "agent_client_description";--> statement-breakpoint
DROP TYPE "agent_commission_approach";--> statement-breakpoint
DROP TYPE "agent_communication_frequency";--> statement-breakpoint
DROP TYPE "agent_difficult_deal_instinct";--> statement-breakpoint
DROP TYPE "agent_response_time";--> statement-breakpoint
DROP TYPE "agent_unrepresented_buyer_approach";--> statement-breakpoint
DROP TYPE "best_client_type";--> statement-breakpoint
DROP TYPE "buyer_bidding_war_response";--> statement-breakpoint
DROP TYPE "buyer_decision_making_need";--> statement-breakpoint
DROP TYPE "buyer_experience_level";--> statement-breakpoint
DROP TYPE "buyer_ideal_agent_relationship";--> statement-breakpoint
DROP TYPE "commission_comfort";--> statement-breakpoint
DROP TYPE "involvement_level";--> statement-breakpoint
DROP TYPE "quick_communication_channel";--> statement-breakpoint
DROP TYPE "response_time_expectation";--> statement-breakpoint
DROP TYPE "seller_agent_silence_preference";--> statement-breakpoint
DROP TYPE "seller_home_connection";--> statement-breakpoint
DROP TYPE "seller_representation_preference";--> statement-breakpoint
DROP TYPE "seller_sale_motivation";--> statement-breakpoint
DROP TYPE "seller_successful_sale_looks_like";--> statement-breakpoint
DROP TYPE "update_delivery_method";