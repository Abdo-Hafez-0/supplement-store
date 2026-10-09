# Supplement Store — Production Plan

Oct 9, 2026 · @Abdulrahman Hafez

## Summary

The store is a custom Next.js application built from scratch, with its own product admin, cart, checkout and orders. No WordPress or WooCommerce. It goes to the client first as a functional prototype on a free Cloudflare subdomain; the brand identity and his own domain come after he approves it.

- **Phase 0, setup (about 1 day):** repo, project skeleton, database, first deploy to the free subdomain.
- **Phase 1, functional prototype (about 15 working days):** admin dashboard, storefront, tier and gift engine, cart, checkout, PayPal in sandbox mode, orders and order emails. Built with a neutral design.
- **Phase 2, identity and launch:** apply the client's brand, connect his domain, switch PayPal to live.
- **Phase 3, later features:** one-click upsell after payment, email capture, sales tax.

Durations are estimates for one developer working with Claude Code. The deadline is "as fast as possible", so the prototype's milestones go to the client for review as each one is ready, instead of in one handover at the end.

## Tech stack

Everything runs on Cloudflare's free tier during the prototype, so the client review costs nothing. Each choice can change before Phase 0 starts.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Your preferred stack; one codebase for storefront, admin and API. |
| Hosting | Cloudflare Workers through the OpenNext adapter | Runs Next.js at the edge; gives a free `projectname.workers.dev` subdomain for review. A custom domain is added later in the same account. |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM | Same platform, free tier, SQL migrations. Drizzle keeps a move to Postgres possible if the store outgrows D1. |
| File storage | Cloudflare R2 | Product images, review images and the how-to video. |
| Admin login | Better Auth (email + password) | Protects the admin dashboard; one admin role in the prototype. |
| Payments | PayPal Orders API v2 on the server + PayPal JS SDK in the browser | Card fields, PayPal button, Apple Pay and Google Pay. Orders are created and captured on the server; a webhook confirms them. Sandbox mode in the prototype. |
| Order emails | Resend + React Email templates | Order confirmation to the customer and a new-order alert to the client. |
| Styling | Tailwind CSS + design tokens | The neutral prototype look is swapped for the brand by changing tokens, not components. |
| Validation | Zod on every server input | Prices, quantities and form data are checked on the server. |
| Tracking | Meta Pixel + Conversions API sent from the server | Purchase events are sent from the order webhook, so they're not blocked by ad blockers. |
| Code and deploys | GitHub repo on your PC, Cloudflare builds on every push | Every branch gets a preview URL; `main` is what the client sees. Local development uses Wrangler with a local D1 copy. |

## What we build

Without WooCommerce, every part of the store is our own code. The modules below are the full prototype scope.

| Module | What it covers | Phase |
| --- | --- | --- |
| Admin: products | Create and edit products, prices, stock, images, tiers, gifts, substitute gifts, order bump, review images | 1 |
| Admin: settings | Banner and badge texts, timer length and expiry behavior, shared video, shipping rules, chat ID | 1 |
| Admin: orders | Order list, order detail, status changes (paid, shipped, refunded), tracking number | 1 |
| Storefront | Home (featured products, FAQ, about, footer contacts), product listing, product page | 1 |
| Product page | Tier cards, promo banner, gift preview, free-shipping callout, countdown timer, how-to video, review carousel | 1 |
| Pricing engine | One server-side function that prices a cart: tiers, gifts, substitutes, bump, shipping | 1 |
| Cart | Server-stored cart keyed by a cookie, slide-out drawer, quantity changes | 1 |
| Checkout | Contact and shipping form, order summary, checkbox order bump, trust badges, payment buttons | 1 |
| Payments | PayPal order create and capture, webhook handling, Apple Pay and Google Pay | 1 |
| Orders and stock | Order saved with a price snapshot, stock reduced on payment, confirmation page | 1 |
| Emails | Customer confirmation, client new-order alert | 1 |
| Tracking and chat | Meta Pixel + Conversions API, live chat loaded on first interaction | 1 |
| Brand and domain | Apply identity tokens, custom domain, PayPal live mode | 2 |
| One-click upsell | Offer after payment, charged with the saved PayPal payment method | 3 |
| Email capture, sales tax | Depend on client decisions | 3 |

## Data model

The client manages everything from the admin dashboard; these are the tables behind it. Money is stored in cents as integers.

| Table | Key fields | Notes |
| --- | --- | --- |
| `products` | id, slug, title, description, regular\_price, stock, images, is\_featured, status | The regular price is the struck-through price. A gift is just another product. |
| `product_tiers` | product\_id, bottles, bundle\_price, badge\_label, sort | Tier count varies per product; a product with no tiers sells at its regular price. |
| `tier_gifts` | tier\_id, gift\_product\_id, gift\_qty, substitute\_product\_id | Gift quantity defaults to bottles − 1; the client can override it. |
| `order_bumps` | product\_id, bump\_product\_id, bump\_price, headline | Offered at checkout when the product is in the cart. |
| `review_images` | product\_id, file\_key, sort | Up to 15 per product, stored in R2. |
| `shipping_methods` | name, price, free\_over\_amount, delivery\_text, active | The client sets shipping from the admin. |
| `settings` | key, value (JSON) | Banner and badge texts, timer, video, chat ID. |
| `carts`, `cart_items` | cart\_id (cookie), product\_id, qty, is\_gift, parent\_item\_id | Gift lines point to their parent line. |
| `orders`, `order_items` | customer and shipping fields, totals, status, paypal\_order\_id; items with unit price snapshot and is\_gift | Prices are copied at purchase, so later admin edits never change past orders. |
| `users` | Better Auth tables | Admin accounts only; customers check out as guests. |

**Pricing rules the engine enforces**

- The browser never sends a price. The server prices every cart from the database, on every change and again at checkout.
- Tier price comes from the real line quantity, so changing it in the drawer re-prices the line.
- Each gift is its own line tied to its parent. Gifts for different products stay separate, even when they're the same gift product.
- Gift lines can't be edited or removed on their own; they follow their parent. A gift product added by itself is charged in full.
- When a gift is out of stock, its substitute is used. Stock is reduced for paid lines and gift lines alike.

## Phase 0 and 1: prototype milestones

Each milestone ends with a deploy to the review subdomain, so the client sees progress every few days. Days are working-day estimates.

| Milestone | Build | Est. days | Client reviews |
| --- | --- | --- | --- |
| M0 Setup | GitHub repo, Next.js + TypeScript, Tailwind, D1 + Drizzle, R2, Better Auth, OpenNext deploy to `workers.dev`, local dev with Wrangler | 1 | The review link works |
| M1 Admin | Admin login, product CRUD with tiers, gifts, substitutes, bump, image and review uploads, settings page, shipping methods | 3 | He enters 2–3 real products himself |
| M2 Storefront | Home, product listing, product page with tier cards, banner, gift preview, shipping callout, timer, video, review carousel | 3 | Product page on his phone |
| M3 Cart | Pricing engine, server cart, gift sync and substitution, slide-out drawer | 2 | Tier and gift behavior |
| M4 Checkout and orders | Checkout form, order bump, PayPal sandbox (card, PayPal, Apple Pay, Google Pay), webhook, order save, stock, confirmation page, emails, admin order list | 4 | A full sandbox order from his phone |
| M5 Finish | Meta Pixel + CAPI, chat loader, speed pass, test run, fixes | 2 | Final prototype sign-off |

**Test run in M5** covers: every tier on 2 products, gift substitution, quantity changes in the drawer, gift removal when going back to 1 bottle, order bump on and off, a price tampering attempt from the browser, a duplicate webhook, all payment methods in sandbox, mobile Safari and Chrome.

Apple Pay needs domain verification with PayPal, which may not work on the shared `workers.dev` subdomain. If it doesn't, Apple Pay is tested after the custom domain is connected in Phase 2.

## Phase 2 and 3: identity, launch, later features

Phase 2 starts when the client approves the prototype and sends his brand identity.

**Phase 2: identity and launch**

1. Apply the brand: logo, colors and fonts into the design tokens, then a polish pass on every page.
2. Client buys his domain; connect it to Cloudflare and the Worker.
3. Switch PayPal from sandbox to live keys, register the live webhook, verify the domain for Apple Pay.
4. Verify the domain in Meta Business Manager and confirm purchase events arrive.
5. Switch email sending to the new domain (DNS records for Resend).
6. Launch with one real low-value order.

**Phase 3: later features**, each quoted on its own:

1. **One-click upsell after payment.** Needs PayPal's saved payment methods (vaulting) enabled on the client's account; the hardest feature in the spec.
2. **Email capture**, once the client picks an email platform.
3. **US sales tax**, once the client decides where he must collect it.

Maintenance after launch is a separate monthly agreement covering dependency updates, backups of the D1 database, uptime checks and a set number of support hours.

## Open questions for the client

Each has a proposed default, so building can start. The default applies if there's no answer before the milestone that needs it.

| Question | Needed by | Proposed default |
| --- | --- | --- |
| Price for quantities above the top tier (e.g. 5 when the top tier is 3)? | M3 | Top tier's per-bottle price × quantity; gifts follow bottles − 1. |
| Any maximum quantity or gift count? | M3 | No cap; a cap field in settings, empty by default. |
| When the timer hits zero, what price applies, and does that visitor's timer restart? | M3 | Bundle prices end and regular price applies for that visitor for 24 hours, then the timer restarts. Enforced by a signed cookie the server checks. |
| "No coupons" vs. the "Save $10 on your first order" offer: which wins? | Phase 3 | No coupon system in the prototype; decided with email capture. |
| Which order bump shows when the cart has several products? | M4 | The bump of the most expensive product in the cart; one bump at a time. |
| Does the bump product get gifts or tier pricing? | M4 | No; a single item at its bump price. |
| Gift and its substitute both out of stock? | M3 | The tier shows no gift and the banner hides the gift text. |
| Customer accounts, or guest checkout only? | M4 | Guest checkout only; order lookup by email + order number. |
| Refunds: from the admin, or in the PayPal dashboard? | M4 | In the PayPal dashboard; the admin only marks the order refunded. |
| One admin login, or several staff accounts? | M1 | One admin account. |
| Phone number at checkout | M4 | Required (client said yes). |

## Risks

Building the commerce core ourselves means we own every bug that WooCommerce would have handled. Most of the risk sits in payments and pricing.

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Price tampering from the browser | Orders at wrong prices | Server prices every cart from the database; the browser never sends a price. |
| Duplicate or missed PayPal webhooks | Double orders, or paid orders marked unpaid | Orders keyed by PayPal order ID (idempotent); capture result also checked directly after payment. |
| Overselling stock | More orders than bottles | Stock reduced in the same database write that marks the order paid. |
| Next.js features that don't run on Workers | Rework late in the build | Deploy from M0 and on every push, so runtime problems show up early. |
| Worker size limits on the free plan | Deploy fails as the app grows | Keep dependencies lean; move to the paid Workers plan if needed. |
| Admin account compromised | Prices or orders changed | Strong password, rate-limited login; two-factor in Phase 2. |
| Brand arrives late or changes the layout | Phase 2 takes longer | Design tokens from day one; layout changes beyond tokens are quoted separately. |
| Client open questions unanswered | Logic built on defaults needs rework | Defaults written above; changes after a milestone's review count as new work. |

**Scope note for the agreement:** the client is responsible for all product content, prices, claims, reviews, legal pages, brand identity and payment-provider approval. The developer delivers the technical build described in this plan.
