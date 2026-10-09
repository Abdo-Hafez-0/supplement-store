# Supplement Store

A custom e-commerce store for 15–25 dietary supplement products sold to US customers.
No WordPress or WooCommerce: the storefront, admin dashboard, cart, checkout, payments and
orders are all our own code. The client manages products, tiers, gifts, order bumps,
shipping and banner texts from the admin dashboard.

Current phase: **Phase 1, functional prototype**, deployed to a free `*.workers.dev`
subdomain for client review. Brand identity and the custom domain come in Phase 2.

## Stack

- **Next.js (App Router) + TypeScript**, strict mode
- **Cloudflare Workers** via the OpenNext adapter (`@opennextjs/cloudflare`)
- **Cloudflare D1** (SQLite) with **Drizzle ORM** and Drizzle migrations
- **Cloudflare R2** for product images, review images and the how-to video
- **Better Auth** (email + password) for admin login only; customers check out as guests
- **PayPal Orders API v2** on the server + **PayPal JS SDK** in the browser
  (card fields, PayPal button, Apple Pay, Google Pay); sandbox during the prototype
- **Resend** + React Email for order emails
- **Tailwind CSS** with design tokens (CSS variables) so the brand can be swapped in later
- **Zod** for validating every server input
- **Vitest** for unit tests

Before adding or configuring any library, check its current official docs. Do not rely on
remembered APIs or version numbers.

## Commands

<!-- Fill in during M0 once the project exists. -->
- `npm run dev` — local Next.js dev server
- `npm run preview` — build and run in the Workers runtime locally
- `npm run deploy` — build and deploy to Cloudflare
- `npm run db:generate` — generate a Drizzle migration from the schema
- `npm run db:migrate:local` / `npm run db:migrate:remote` — apply migrations to D1
- `npm run test` — Vitest

## Project structure

```
src/
  app/
    (store)/          storefront routes: home, products, product page, cart, checkout, order confirmation
    admin/            admin dashboard (protected)
    api/              route handlers: cart, checkout, PayPal webhook, auth
  lib/
    db/               Drizzle schema, client, queries
    pricing/          the pricing engine (pure functions, fully unit-tested)
    paypal/           PayPal server client: create order, capture, verify webhook
    email/            Resend client and React Email templates
    auth/             Better Auth setup
    validation/       Zod schemas
  components/
    store/            storefront components
    admin/            admin components
    ui/               shared primitives that read design tokens
drizzle/              generated migrations (committed)
```

## Data model (summary)

`products`, `product_tiers`, `tier_gifts` (gift + substitute per tier), `order_bumps`,
`review_images`, `shipping_methods`, `settings` (key + JSON value), `carts`, `cart_items`
(`is_gift`, `parent_item_id`), `orders`, `order_items` (price snapshot, `is_gift`), plus
Better Auth's tables. The full table list is in the production plan doc.

## Rules that must never be broken

1. **Money is integer cents.** Never store or compute prices as floats.
2. **The server prices everything.** The browser sends product IDs and quantities only,
   never prices. The pricing engine in `src/lib/pricing` recomputes the cart from the
   database on every cart change and again at checkout.
3. **Gift lines follow their parent.** A gift line cannot be edited or removed on its own.
   Gifts for different parent products stay as separate lines, even when they are the same
   gift product. A gift product added by itself is charged its full price.
4. **Orders snapshot prices.** `order_items` copy the unit price at purchase time; later
   admin edits never change past orders.
5. **Payments are idempotent.** Orders are keyed by PayPal order ID. A webhook that arrives
   twice must not create two orders or reduce stock twice. Stock is reduced in the same
   write that marks the order paid.
6. **Validate every server input with Zod.** Reject, don't coerce, unexpected shapes.
7. **Admin routes and admin API handlers check the session on the server**, not only in
   the UI.
8. **No secrets in the repo.** Local secrets go in `.dev.vars` (git-ignored); deployed
   secrets go in via `wrangler secret put`.
9. **Workers runtime, not Node.** No `fs`, no long-running processes. Access D1, R2 and env
   vars through Cloudflare bindings (`getCloudflareContext()` from the OpenNext adapter).
   Prefer libraries that work on the Workers runtime; check before adding one.
10. **Colors, fonts, radii and spacing come from design tokens.** No hard-coded hex values
    in components, so Phase 2 can apply the brand by editing tokens.

## Pricing engine behavior

- A product with no tiers sells at its regular price.
- Tier price comes from the real line quantity (not which card was clicked).
- Gift quantity defaults to `bottles - 1` and can be overridden per tier.
- If a gift is out of stock, use its substitute; if both are out, no gift and the gift
  text is hidden.
- Quantities above the top tier: top tier's per-bottle price × quantity, gifts = qty - 1
  (default; may change — see open questions in the plan).
- The engine is a set of pure functions with unit tests for every rule above.

## Working agreements

- Work milestone by milestone (M0–M5). Finish a milestone, run the tests, deploy, then stop
  and summarize what the client should review.
- Small commits with clear messages; push to GitHub. `main` is what the client sees.
- When a requirement is unclear, check the open questions in the plan, use its stated
  default, and note the assumption in the milestone summary.
- Stop and ask before anything that needs the developer's accounts or money: Cloudflare,
  GitHub, PayPal, Resend, Meta, or a paid plan.

## Milestones

- [ ] M0 Setup — repo, Next.js, Tailwind, D1 + Drizzle, R2, Better Auth, deploy to workers.dev
- [ ] M1 Admin — login, products with tiers/gifts/bump/images, settings, shipping methods
- [ ] M2 Storefront — home, listing, product page (tiers, banner, gift preview, timer, video, reviews)
- [ ] M3 Cart — pricing engine, server cart, gift sync, slide-out drawer
- [ ] M4 Checkout and orders — checkout, order bump, PayPal sandbox, webhook, orders, stock, emails
- [ ] M5 Finish — Meta Pixel + CAPI, chat loader, speed pass, full test run
