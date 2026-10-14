CREATE TABLE `profile_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`profile_json` text NOT NULL,
	`wallet_json` text NOT NULL,
	`routine_json` text NOT NULL,
	`regret_json` text DEFAULT '{}' NOT NULL,
	`recorded_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `phone_profiles` ADD `regret_json` text DEFAULT '{}' NOT NULL;