"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

// Sign-in happens in the browser through the auth client so it goes through
// Better Auth's HTTP handler, which applies the login rate limit.

export async function signOut() {
  const requestHeaders = await headers();
  await getAuth().api.signOut({ headers: requestHeaders });
  redirect("/admin/login");
}
