CREATE TABLE `batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zone_id` integer NOT NULL,
	`grade_id` text NOT NULL,
	`status` text DEFAULT 'filling' NOT NULL,
	`min_workshops` integer NOT NULL,
	`target_kg` integer NOT NULL,
	`buyer_id` integer,
	`locked_price_per_kg` integer,
	`locked_usd` integer,
	`locked_cathode` integer,
	`commission_pct` real,
	`created_at` integer NOT NULL,
	`ready_at` integer,
	`sold_at` integer,
	`settled_at` integer,
	FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyer_id`) REFERENCES `buyers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `batches_status_idx` ON `batches` (`status`);--> statement-breakpoint
CREATE TABLE `buyers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`company` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`has_spectrometer` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`family` text NOT NULL,
	`coef` real NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `loads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workshop_id` integer NOT NULL,
	`batch_id` integer NOT NULL,
	`grade_id` text NOT NULL,
	`est_kg` integer NOT NULL,
	`oil_level` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`actual_kg` real,
	`actual_oil` text,
	`discrepancy` text,
	`payable_toman` integer,
	`created_at` integer NOT NULL,
	`picked_at` integer,
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `loads_batch_idx` ON `loads` (`batch_id`);--> statement-breakpoint
CREATE INDEX `loads_ws_idx` ON `loads` (`workshop_id`);--> statement-breakpoint
CREATE TABLE `otps` (
	`phone` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `price_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ts` integer NOT NULL,
	`usd` integer NOT NULL,
	`cathode` integer NOT NULL,
	`usd_source` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`role` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_idx` ON `users` (`phone`);--> statement-breakpoint
CREATE TABLE `workshops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`zone_id` integer NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`sheba` text DEFAULT '' NOT NULL,
	`strikes` integer DEFAULT 0 NOT NULL,
	`penalty_toman` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
