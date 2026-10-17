CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`expires` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_token_hash_unique` ON `members` (`token_hash`);--> statement-breakpoint
ALTER TABLE `tracks` ADD `audience` text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `release_at` integer;