CREATE TABLE `recovery_keys` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recovery_keys_phone_unique` ON `recovery_keys` (`phone`);--> statement-breakpoint
CREATE TABLE `recovery_limits` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 1 NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visitor_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `phone_profiles` ADD `tracking_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `profile_history` ADD `tracking_json` text DEFAULT '{}' NOT NULL;