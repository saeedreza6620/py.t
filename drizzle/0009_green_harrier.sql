CREATE TABLE `assistant_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assistant_message_id` text NOT NULL,
	`intent` text NOT NULL,
	`decision` text NOT NULL,
	`explanation` text DEFAULT '' NOT NULL,
	`knowledge_version` text NOT NULL,
	`source_ids_json` text DEFAULT '[]' NOT NULL,
	`market_snapshot_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assistant_decisions_user_created_idx` ON `assistant_decisions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `assistant_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assistant_message_id` text NOT NULL,
	`rating` text NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`adverse_signal` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assistant_feedback_user_created_idx` ON `assistant_feedback` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `assistant_feedback_message_idx` ON `assistant_feedback` (`assistant_message_id`);--> statement-breakpoint
CREATE TABLE `assistant_knowledge_releases` (
	`version` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`source_ids_json` text DEFAULT '[]' NOT NULL,
	`rule_ids_json` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`published_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assistant_knowledge_rules` (
	`rule_id` text PRIMARY KEY NOT NULL,
	`rule_key` text NOT NULL,
	`version` integer NOT NULL,
	`title` text NOT NULL,
	`trigger_terms_json` text DEFAULT '[]' NOT NULL,
	`conditions_json` text DEFAULT '{}' NOT NULL,
	`recommendation` text NOT NULL,
	`safety_level` text DEFAULT 'guidance' NOT NULL,
	`evidence_level` text NOT NULL,
	`source_ids_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`valid_from` text NOT NULL,
	`expires_at` text,
	`superseded_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assistant_knowledge_rules_status_valid_idx` ON `assistant_knowledge_rules` (`status`,`valid_from`);--> statement-breakpoint
CREATE INDEX `assistant_knowledge_rules_key_version_idx` ON `assistant_knowledge_rules` (`rule_key`,`version`);--> statement-breakpoint
CREATE TABLE `assistant_knowledge_sources` (
	`source_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`publisher` text NOT NULL,
	`source_type` text NOT NULL,
	`url` text NOT NULL,
	`region` text DEFAULT 'global' NOT NULL,
	`evidence_level` text NOT NULL,
	`topics_json` text DEFAULT '[]' NOT NULL,
	`summary` text NOT NULL,
	`published_at` text,
	`checked_at` text NOT NULL,
	`expires_at` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`content_fingerprint` text DEFAULT '' NOT NULL,
	`version` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assistant_knowledge_sources_status_checked_idx` ON `assistant_knowledge_sources` (`status`,`checked_at`);--> statement-breakpoint
CREATE TABLE `assistant_products` (
	`product_id` text PRIMARY KEY NOT NULL,
	`gtin` text,
	`irc` text,
	`brand` text NOT NULL,
	`name_fa` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`variant` text DEFAULT '' NOT NULL,
	`volume` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`inci_json` text DEFAULT '[]' NOT NULL,
	`source_id` text,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`verified_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assistant_products_gtin_idx` ON `assistant_products` (`gtin`);--> statement-breakpoint
CREATE INDEX `assistant_products_irc_idx` ON `assistant_products` (`irc`);--> statement-breakpoint
CREATE INDEX `assistant_products_status_idx` ON `assistant_products` (`verification_status`);--> statement-breakpoint
CREATE TABLE `assistant_verified_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`seller` text NOT NULL,
	`cash_price` integer,
	`discount_price` integer,
	`stock_status` text NOT NULL,
	`shipping_cost` integer,
	`down_payment` integer,
	`installment_count` integer,
	`installment_amount` integer,
	`total_fee` integer,
	`final_installment_cost` integer,
	`direct_product_url` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text,
	`observed_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assistant_offers_product_status_expiry_idx` ON `assistant_verified_offers` (`product_id`,`verification_status`,`expires_at`);