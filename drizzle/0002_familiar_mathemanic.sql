ALTER TABLE `order_bumps` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `order_bumps` DROP COLUMN `price_cents`;--> statement-breakpoint
ALTER TABLE `order_bumps` DROP COLUMN `is_active`;--> statement-breakpoint
ALTER TABLE `order_bumps` DROP COLUMN `sort_order`;--> statement-breakpoint
ALTER TABLE `product_tiers` DROP COLUMN `unit_price_cents`;--> statement-breakpoint
ALTER TABLE `product_tiers` DROP COLUMN `label`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `compare_at_price_cents`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `is_active`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `is_listed`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `image_key`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `video_key`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `banner_text`;--> statement-breakpoint
ALTER TABLE `review_images` DROP COLUMN `image_key`;--> statement-breakpoint
ALTER TABLE `shipping_methods` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `tier_gifts` DROP COLUMN `quantity_override`;--> statement-breakpoint
ALTER TABLE `tier_gifts` DROP COLUMN `gift_text`;