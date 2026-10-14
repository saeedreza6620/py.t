ALTER TABLE `assistant_messages` RENAME TO `assistant_messages_legacy`;
--> statement-breakpoint
CREATE TABLE `assistant_market_memory` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_name` text DEFAULT '' NOT NULL,
	`seller` text DEFAULT '' NOT NULL,
	`price` text DEFAULT '' NOT NULL,
	`discount_text` text DEFAULT '' NOT NULL,
	`availability` text DEFAULT '' NOT NULL,
	`installment` text DEFAULT '' NOT NULL,
	`product_url` text DEFAULT '' NOT NULL,
	`captured_at` text NOT NULL,
	`source` text DEFAULT 'user_supplied' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assistant_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`meta_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assistant_rate_limits` (
	`scope_hash` text PRIMARY KEY NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`window_start` integer NOT NULL
);

--> statement-breakpoint
INSERT INTO `assistant_messages` (`id`,`user_id`,`role`,`content`,`meta_json`,`created_at`) SELECT 'legacy-user-' || `id`, `phone`, 'user', `question`, '{}', `created_at` FROM `assistant_messages_legacy`;
--> statement-breakpoint
INSERT INTO `assistant_messages` (`id`,`user_id`,`role`,`content`,`meta_json`,`created_at`) SELECT 'legacy-assistant-' || `id`, `phone`, 'assistant', `answer`, '{}', `created_at` FROM `assistant_messages_legacy`;
--> statement-breakpoint
DROP TABLE `assistant_messages_legacy`;
--> statement-breakpoint
CREATE INDEX `assistant_messages_user_created_idx` ON `assistant_messages` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `assistant_market_user_captured_idx` ON `assistant_market_memory` (`user_id`,`captured_at`);
