CREATE TABLE `notification_schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`item_type` text NOT NULL,
	`notification_type` text NOT NULL,
	`scheduled_for` integer NOT NULL,
	`expo_notif_id` text,
	`fired_at` integer,
	`dismissed_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
