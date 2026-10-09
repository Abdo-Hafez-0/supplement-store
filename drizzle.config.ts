import { defineConfig } from "drizzle-kit";

// drizzle-kit only generates SQL here; wrangler applies it to D1
// (`npm run db:migrate:local` / `db:migrate:remote`).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
});
