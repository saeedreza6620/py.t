CREATE TABLE `admin_login_limits` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 1 NOT NULL,
	`window_start` integer NOT NULL
);
