INSERT INTO "buyer_profiles" ("id", "user_id", "status", "state", "city", "zip_codes", "timeline", "price_range", "estimated_home_value", "property_types", "experience_level", "preferred_contact_method", "involvement_level", "representation_preference", "commission_comfort", "match_priorities", "match_details", "created_at", "updated_at")
SELECT "id", "user_id", "status", "state", "city", "zip_codes", "timeline", "price_range", "estimated_home_value", "property_types", "experience_level", "preferred_contact_method", "involvement_level", "representation_preference", "commission_comfort", "match_priorities", "match_details", "created_at", "updated_at"
FROM "consumer_profiles"
WHERE "intent" IN ('buying', 'both');
--> statement-breakpoint
INSERT INTO "seller_profiles" ("id", "user_id", "status", "state", "city", "zip_codes", "timeline", "price_range", "estimated_home_value", "property_types", "experience_level", "preferred_contact_method", "involvement_level", "representation_preference", "commission_comfort", "match_priorities", "match_details", "created_at", "updated_at")
SELECT "id", "user_id", "status", "state", "city", "zip_codes", "timeline", "price_range", "estimated_home_value", "property_types", "experience_level", "preferred_contact_method", "involvement_level", "representation_preference", "commission_comfort", "match_priorities", "match_details", "created_at", "updated_at"
FROM "consumer_profiles"
WHERE "intent" IN ('selling', 'both');
--> statement-breakpoint
DROP TABLE "consumer_profiles" CASCADE;