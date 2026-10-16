CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`track` text NOT NULL,
	`country` text NOT NULL,
	`at` integer NOT NULL,
	`seconds` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`mood` text NOT NULL,
	`audio` text NOT NULL,
	`cover` text NOT NULL,
	`youtube` text,
	`created` integer NOT NULL
);
