/**
 * Creates the first admin on a running site by calling POST /api/admin/bootstrap.
 * Asks for ADMIN_PASSWORD without echoing it, so it never lands in shell history.
 *
 *   npm run admin:bootstrap -- https://supplement-store.<subdomain>.workers.dev
 *   npm run admin:bootstrap -- http://localhost:3000
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";

function promptHidden(question: string): Promise<string> {
  process.stdout.write(question);
  const muted = new Writable({ write: (_chunk, _enc, done) => done() });
  const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
  return new Promise((resolve) =>
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    }),
  );
}

async function main() {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error("Usage: npm run admin:bootstrap -- <site URL>");
    process.exit(1);
  }
  const password = await promptHidden("ADMIN_PASSWORD (same value as the secret): ");
  const response = await fetch(new URL("/api/admin/bootstrap", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  console.log(response.status, await response.text());
  if (!response.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
