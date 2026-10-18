// Test helper: an in-memory SQLite database (Node's built-in node:sqlite) with every
// committed Drizzle migration applied, behind Drizzle's sqlite-proxy driver. Batches
// run in a transaction, like D1 batches. Lets tests check real SQL (idempotent
// payment writes, stock) without the Workers runtime.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { Db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

const MIGRATIONS = join(process.cwd(), "drizzle");

export function createTestDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const file of readdirSync(MIGRATIONS).filter((name) => name.endsWith(".sql")).sort()) {
    for (const statement of readFileSync(join(MIGRATIONS, file), "utf8").split("--> statement-breakpoint")) {
      if (statement.trim()) sqlite.exec(statement);
    }
  }

  const run = (sql: string, params: unknown[], method: "run" | "all" | "values" | "get") => {
    const statement = sqlite.prepare(sql);
    const args = params as SQLInputValue[];
    if (method === "run") {
      statement.run(...args);
      return { rows: [] };
    }
    statement.setReturnArrays(true);
    // drizzle maps a missing row from rows: undefined
    if (method === "get") return { rows: statement.get(...args) as unknown as unknown[] };
    return { rows: statement.all(...args) as unknown as unknown[][] };
  };

  const db = drizzle(
    async (sql, params, method) => run(sql, params, method),
    async (queries) => {
      sqlite.exec("BEGIN");
      try {
        const results = queries.map(({ sql, params, method }) => run(sql, params, method));
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    { schema },
  );
  // Same query builder API as the D1 client for everything the app code uses.
  return { db: db as unknown as Db, sqlite };
}
