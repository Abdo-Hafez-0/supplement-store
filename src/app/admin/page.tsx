import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await requireAdmin();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <form action={signOut}>
          <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm">
            Sign out
          </button>
        </form>
      </div>
      <p className="text-muted">Signed in as {session.user.email}.</p>
      <p className="text-muted">Products, tiers, gifts and settings arrive in M1.</p>
    </main>
  );
}
