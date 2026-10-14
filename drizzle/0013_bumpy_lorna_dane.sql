CREATE TABLE `skin_forum_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_hash` text NOT NULL,
	`product_id` text DEFAULT '' NOT NULL,
	`product_name` text DEFAULT '' NOT NULL,
	`kind` text NOT NULL,
	`skin_type` text DEFAULT '' NOT NULL,
	`duration` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE INDEX `skin_forum_status_created_idx` ON `skin_forum_posts` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `skin_forum_product_status_idx` ON `skin_forum_posts` (`product_id`,`status`);--> statement-breakpoint
CREATE INDEX `skin_forum_author_created_idx` ON `skin_forum_posts` (`author_hash`,`created_at`);