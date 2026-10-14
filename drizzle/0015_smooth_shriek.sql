CREATE TABLE `assistant_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`message_id` text NOT NULL,
	`model` text NOT NULL,
	`tier` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`web_search` integer DEFAULT 0 NOT NULL,
	`estimated_model_toman` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assistant_usage_message_id_unique` ON `assistant_usage` (`message_id`);--> statement-breakpoint
CREATE INDEX `assistant_usage_user_created_idx` ON `assistant_usage` (`user_id`,`created_at`);