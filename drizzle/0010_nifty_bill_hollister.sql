ALTER TABLE `assistant_decisions` ADD `confidence` text DEFAULT 'low' NOT NULL;--> statement-breakpoint
ALTER TABLE `assistant_decisions` ADD `missing_data_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `assistant_decisions` ADD `profile_updated_at` text;--> statement-breakpoint
ALTER TABLE `assistant_decisions` ADD `user_action` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `assistant_decisions` ADD `outcome_status` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `assistant_decisions` ADD `updated_at` text DEFAULT '' NOT NULL;