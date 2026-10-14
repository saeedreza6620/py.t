CREATE TABLE `users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`profile_json` text DEFAULT '{}' NOT NULL,
	`wallet_json` text DEFAULT '[]' NOT NULL,
	`routine_json` text DEFAULT '{}' NOT NULL,
	`admin_consent` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
