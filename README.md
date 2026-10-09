# Supplement Store

Custom e-commerce store (Next.js on Cloudflare Workers, D1, R2, Better Auth, PayPal).
See `CLAUDE.md` for the stack, rules and milestones.

Prototype: https://supplement-store.abdohafez731.workers.dev (health check at `/health`).

## Local setup

Requires Node.js 22+ (developed on 24) and npm. On Windows, OpenNext warns that support
is not guaranteed; WSL is the fallback if builds misbehave.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local secrets. Copy `.dev.vars.example` to `.dev.vars` (git-ignored) and fill in
   `BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`) and `ADMIN_PASSWORD`
   (12+ characters).

3. Create the local database, then add the sample data:

   ```bash
   npm run db:migrate:local
   npm run db:seed:local
   ```

4. Start the dev server and create the local admin (in a second terminal):

   ```bash
   npm run dev
   npm run admin:bootstrap -- http://localhost:3000
   ```

   Then sign in at http://localhost:3000/admin.

5. Before deploying, check the app in the real Workers runtime:

   ```bash
   npm run preview
   ```

   It serves on http://localhost:8787.

6. Run the tests:

   ```bash
   npm run test
   ```

## Admin

Sign in at `/admin`. Products (with tiers, gifts, order bump, images and review images),
shipping methods and settings are managed there. Files upload to R2 in 10 MB chunks and are
served from `/media/...`. Login is limited to 5 attempts per IP per 5 minutes.

## Deploying

Pushes to `main` deploy automatically through Cloudflare Workers Builds (deploy command
`npm run deploy`). Migrations are not applied by the build: run
`npm run db:migrate:remote` before pushing a change that adds one.

Manual deploy from your machine:

```bash
npm run db:migrate:remote
npm run deploy
```

Production secrets are set once with `npx wrangler secret put <NAME>`:
`BETTER_AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. `BETTER_AUTH_URL` is a plain var in
`wrangler.jsonc`.
