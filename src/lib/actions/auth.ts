"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/client";

// Authorized Tadbeer admin accounts
const AUTHORIZED_ADMIN_EMAILS = [
  "operation@tadbeertt.com",
  "taufiq@tadbeertt.com",
  "ramij@tadbeertt.com",
  "admin@tadbeertt.com",
];

export async function loginAction(formData: { email: string; password: string }) {
  const { email, password } = formData;
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPassword = (password || "").trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: "Email and password are required." };
  }

  // 1. Attempt Supabase Auth
  try {
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (!authError && data?.session) {
      const cookieStore = await cookies();
      cookieStore.set("tadbeer-auth", "true", { path: "/", maxAge: 86400, sameSite: "lax" });
      cookieStore.set("tadbeer-user-email", cleanEmail, { path: "/", maxAge: 86400, sameSite: "lax" });
      cookieStore.set("tadbeer-user-role", "admin", { path: "/", maxAge: 86400, sameSite: "lax" });

      return { success: true, user: { email: cleanEmail, role: "admin" } };
    }
  } catch (err) {
    console.warn("Supabase auth check fallback:", err);
  }

  // 2. Hard password verification on backend server
  const isAuthorizedEmail = AUTHORIZED_ADMIN_EMAILS.some((a) => a.toLowerCase() === cleanEmail);
  const backendAdminPassword = process.env.ADMIN_PASSWORD || "Tadbeer#2026!SecureAdminPass";

  if (isAuthorizedEmail && cleanPassword === backendAdminPassword) {
    const cookieStore = await cookies();
    cookieStore.set("tadbeer-auth", "true", { path: "/", maxAge: 86400, sameSite: "lax" });
    cookieStore.set("tadbeer-user-email", cleanEmail, { path: "/", maxAge: 86400, sameSite: "lax" });
    cookieStore.set("tadbeer-user-role", "admin", { path: "/", maxAge: 86400, sameSite: "lax" });

    return { success: true, user: { email: cleanEmail, role: "admin" } };
  }

  return {
    success: false,
    error: "Invalid email or password. Access restricted to authorized Tadbeer administrators.",
  };
}
