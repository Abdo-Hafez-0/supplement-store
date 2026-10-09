import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../actions";

export const metadata: Metadata = {
  title: { template: "%s · Admin", default: "Admin" },
  robots: { index: false, follow: false },
};

// The layout check is a convenience for rendering the header; every page and
// server action still calls requireAdmin() itself (layouts don't re-run on
// client navigation, and actions are callable directly).
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-3 px-gutter py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold">Store admin</span>
            <AdminNav />
          </div>
          <form action={signOut} className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{session.user.email}</span>
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-page flex-1 flex-col gap-6 px-gutter py-8">{children}</main>
    </div>
  );
}
