# M0 kickoff — setup and first deploy

## Before you start (you, once)

1. Install **Node.js LTS**, **Git**, and **Claude Code** on your PC.
2. Create a free **Cloudflare** account.
3. Create an empty **GitHub** repo (private), e.g. `supplement-store`.
4. Make an empty project folder, put `CLAUDE.md` inside it, and open Claude Code in that folder.
5. Paste the prompt below into Claude Code.

Claude Code will stop and ask you when a step needs you to log in (`wrangler login`,
GitHub authentication). Those are yours to do.

---

## Prompt to paste into Claude Code

```
Read CLAUDE.md first. We are doing milestone M0: project setup and first deploy.
Check the current official docs for each tool before installing or configuring it.
Do not guess versions or APIs from memory.

Do these in order, and commit after each numbered step:

1. Create a Next.js app in this folder: TypeScript (strict), App Router, src/ directory,
   Tailwind CSS, ESLint. Use npm.

2. Add the OpenNext Cloudflare adapter (@opennextjs/cloudflare) following its current
   "existing Next.js app" guide. Set up the wrangler config, open-next config, and the
   preview and deploy npm scripts. The Worker name is "supplement-store".

3. Create a D1 database named "supplement-store-db" and an R2 bucket named
   "supplement-store-media", and bind both in the wrangler config. Stop and ask me to run
   `wrangler login` if needed.

4. Set up Drizzle ORM for D1:
   - Schema in src/lib/db/schema.ts with these tables: products, product_tiers,
     tier_gifts, order_bumps, review_images, shipping_methods, settings, carts,
     cart_items, orders, order_items. Use the fields described in CLAUDE.md and these
     extras: money as integer cents, created_at/updated_at timestamps, foreign keys
     with sensible cascade rules, and a unique index on orders.paypal_order_id.
   - A db client helper that gets the D1 binding via getCloudflareContext().
   - npm scripts: db:generate, db:migrate:local, db:migrate:remote.
   - Generate the first migration and apply it locally.

5. Set up Better Auth with email + password using the Drizzle adapter on D1. Generate
   its tables into the same schema and migration flow. Add a protected /admin page that
   redirects to /admin/login when there is no session, and a script or one-time route
   to create the first admin user from env vars (ADMIN_EMAIL, ADMIN_PASSWORD).
   Put local secrets in .dev.vars and make sure it is git-ignored.

6. Design tokens: in the global CSS define CSS variables for colors (background,
   surface, text, muted, accent, success, warning, danger), font families, radius and
   spacing, and map them into the Tailwind theme. Neutral, plain look for now.

7. Seed script (local only) that inserts 2 sample products, each with 3 tiers
   (1, 2, 3 bottles), a gift product with a substitute, one order bump, and one free
   shipping method. Clearly label them as sample data.

8. A /health route that returns JSON with the app version and the number of products
   in D1, proving the database binding works in the Workers runtime.

9. Set up Vitest with one passing placeholder test in src/lib/pricing.

10. Connect to GitHub: add the remote for my repo (ask me for the URL), push main.

11. Deploy to Cloudflare with the deploy script. Apply migrations to the remote D1,
    set the production secrets with `wrangler secret put` (ask me for values), and
    create the admin user on the deployed site.

12. Update the "Commands" section of CLAUDE.md with the real scripts, tick M0 in the
    milestone list, and write a short README with local setup steps.

Done when:
- `npm run preview` runs the app locally in the Workers runtime.
- The deployed https://supplement-store.<my-subdomain>.workers.dev/health shows the
  product count from D1.
- I can log in at /admin on the deployed site.
- Tests pass and everything is pushed to GitHub.

When finished, give me: the deployed URL, a list of what was set up, any assumptions
you made, and anything that did not work on the Workers runtime.
```

---

## After M0

Ask Claude Code to connect the GitHub repo to **Cloudflare Workers Builds** so every push
to `main` deploys automatically and other branches get preview URLs. Then start M1 with a
prompt like: *"Read CLAUDE.md. Start milestone M1: admin dashboard…"* and list the M1
items from the plan.
