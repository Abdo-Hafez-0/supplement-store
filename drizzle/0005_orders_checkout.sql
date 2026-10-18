-- Recreates orders with the order number, required phone and tracking fields.
-- No rows are copied: orders was empty everywhere when this ran (M4 had not started).
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`paypal_order_id` text NOT NULL,
	`paypal_capture_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`shipping_name` text NOT NULL,
	`shipping_line1` text NOT NULL,
	`shipping_line2` text,
	`shipping_city` text NOT NULL,
	`shipping_state` text NOT NULL,
	`shipping_postal_code` text NOT NULL,
	`shipping_country` text DEFAULT 'US' NOT NULL,
	`shipping_method_id` integer,
	`shipping_method_name` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`shipping_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`cart_id` text,
	`paid_at` integer,
	`tracking_number` text,
	`shipped_at` integer,
	`refunded_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_paypal_order_id_unique` ON `orders` (`paypal_order_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);