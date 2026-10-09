-- Hand-edited: the catalog tables are empty in every environment at this point, so
-- they are recreated to match the schema exactly (SQLite cannot ADD a NOT NULL column
-- without a default, and ADD COLUMN drops the ON DELETE rule of a new foreign key).
-- Children first; their parents are recreated below with the same names.
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);
--> statement-breakpoint
ALTER TABLE `shipping_methods` ADD `delivery_text` text DEFAULT '' NOT NULL;
--> statement-breakpoint
DROP TABLE `order_bumps`;
--> statement-breakpoint
DROP TABLE `review_images`;
--> statement-breakpoint
DROP TABLE `tier_gifts`;
--> statement-breakpoint
DROP TABLE `product_tiers`;
--> statement-breakpoint
DROP TABLE `products`;
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`short_description` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`regular_price_cents` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);
--> statement-breakpoint
CREATE TABLE `product_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`bottles` integer NOT NULL,
	`bundle_price_cents` integer NOT NULL,
	`badge_label` text,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_tiers_product_bottles_unique` ON `product_tiers` (`product_id`,`bottles`);
--> statement-breakpoint
CREATE TABLE `order_bumps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`bump_product_id` integer NOT NULL,
	`bump_price_cents` integer NOT NULL,
	`headline` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bump_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_bumps_product_unique` ON `order_bumps` (`product_id`);
--> statement-breakpoint
CREATE TABLE `review_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`file_key` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_images_product_idx` ON `review_images` (`product_id`);
--> statement-breakpoint
CREATE TABLE `tier_gifts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tier_id` integer NOT NULL,
	`gift_product_id` integer NOT NULL,
	`substitute_product_id` integer,
	`gift_qty` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tier_id`) REFERENCES `product_tiers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gift_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`substitute_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tier_gifts_tier_unique` ON `tier_gifts` (`tier_id`);
