CREATE TABLE `otp_ip_limits` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`send_count` integer DEFAULT 1 NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phone_otps` (
	`phone` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_send_at` integer NOT NULL,
	`send_count` integer DEFAULT 1 NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phone_profiles` (
	`phone` text PRIMARY KEY NOT NULL,
	`profile_json` text DEFAULT '{}' NOT NULL,
	`wallet_json` text DEFAULT '[]' NOT NULL,
	`routine_json` text DEFAULT '{}' NOT NULL,
	`admin_consent` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phone_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`expires_at` integer NOT NULL
);
