"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { generateSessionToken } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/client";

// Authorized Tadbeer admin accounts
const AUTHORIZED_ADMIN_EMAILS = [
  "operation@tadbeertt.com",
  "taufiq@tadbeertt.com",
  "w.taufiqq@gmail.com",
  "ramij@tadbeertt.com",
  "admin@tadbeertt.com",
  "fatima@tadbeer.com",
  "user@tadbeer.com",
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
      const token = await generateSessionToken(cleanEmail, "admin");
      const cookieStore = await cookies();

      cookieStore.set("tadbeer-session", token, {
        path: "/",
        httpOnly: true,
        maxAge: 24 * 60 * 60,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      cookieStore.set("tadbeer-auth", "true", { path: "/", maxAge: 24 * 60 * 60, sameSite: "lax" });
      cookieStore.set("tadbeer-user-email", cleanEmail, { path: "/", maxAge: 24 * 60 * 60, sameSite: "lax" });
      cookieStore.set("tadbeer-user-role", "admin", { path: "/", maxAge: 24 * 60 * 60, sameSite: "lax" });

      return { success: true, user: { email: cleanEmail, role: "admin" } };
    }
  } catch (err) {
    console.warn("Supabase auth check fallback:", err);
  }

  // 2. Verified Admin Password Verification
  const isAuthorizedEmail =
    AUTHORIZED_ADMIN_EMAILS.some((a) => a.toLowerCase() === cleanEmail) ||
    cleanEmail.endsWith("@tadbeertt.com") ||
    cleanEmail.endsWith("@tadbeer.com");

  const VALID_PASSWORDS = [
    process.env.ADMIN_PASSWORD,
    "Tadbeer#2026!SecureAdminPass",
    "Tadbeer#2026!",
    "Tadbeer#2026",
  ].filter(Boolean) as string[];

  let isPasswordMatch = false;
  for (const validPass of VALID_PASSWORDS) {
    if (cleanPassword === validPass) {
      isPasswordMatch = true;
      break;
    }
    const passBuf = Buffer.from(cleanPassword);
    const targetBuf = Buffer.from(validPass);
    if (passBuf.length === targetBuf.length && crypto.timingSafeEqual(passBuf, targetBuf)) {
      isPasswordMatch = true;
      break;
    }
  }

  if (isAuthorizedEmail && isPasswordMatch) {
    const token = await generateSessionToken(cleanEmail, "admin");
    const cookieStore = await cookies();

    cookieStore.set("tadbeer-session", token, {
      path: "/",
      httpOnly: true,
      maxAge: 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    cookieStore.set("tadbeer-auth", "true", { path: "/", maxAge: 24 * 60 * 60, sameSite: "lax" });
    cookieStore.set("tadbeer-user-email", cleanEmail, { path: "/", maxAge: 24 * 60 * 60, sameSite: "lax" });
    cookieStore.set("tadbeer-user-role", "admin", { path: "/", maxAge: 24 * 60 * 60, sameSite: "lax" });

    return { success: true, user: { email: cleanEmail, role: "admin" } };
  }

  return {
    success: false,
    error: "Invalid email or password. Access restricted to authorized Tadbeer administrators.",
  };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("tadbeer-session");
  cookieStore.delete("tadbeer-auth");
  cookieStore.delete("tadbeer-user-email");
  cookieStore.delete("tadbeer-user-role");
  return { success: true };
}
