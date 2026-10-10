"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { getIdentity } from "@/lib/auth/session";
import { siteURL } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
export type AuthState = { error?: string; message?: string };
export async function authenticate(
  mode: string,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({
      email: z.email().max(254),
      password: z.string().max(200).optional(),
    })
    .safeParse({
      email: form.get("email"),
      password: form.get("password") ?? undefined,
    });
  if (!parsed.success) return { error: "Enter a valid email address." };
  const { email, password } = parsed.data;
  if (mode === "login" && !password) return { error: "Enter your password." };
  let recovery = false;
  try {
    if (process.env.SUPABASE_SECRET_KEY)
      await rateLimit("auth", email.toLowerCase());
    const db = await serverClient();
    if (mode === "forgot") {
      await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteURL()}/auth/confirm`,
      });
      recovery = true;
    } else {
      const { error } = await db.auth.signInWithPassword({
        email,
        password: password!,
      });
      if (error)
        return {
          error: "Unable to sign in. Check your credentials and try again.",
        };
      const identity = await getIdentity();
      if (!identity) {
        await db.auth.signOut();
        return {
          error:
            "This account has no active staff access. Contact your administrator.",
        };
      }
      if (identity.needsMfa) redirect("/admin/mfa");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT"))
      throw error;
    return {
      error:
        "Sign-in service is unavailable or rate limited. Check setup and try again later.",
    };
  }
  if (recovery)
    return {
      message:
        "If the account is eligible, a password-reset email will arrive shortly.",
    };
  redirect("/admin/dashboard");
}
export async function resetPassword(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const password = z.string().min(12).max(200).safeParse(form.get("password"));
  if (!password.success || password.data !== form.get("confirm"))
    return { error: "Use matching passwords with at least 12 characters." };
  try {
    const db = await serverClient();
    const { data } = await db.auth.getUser();
    if (!data.user)
      return {
        error: "Your link has expired. Request a new password-reset email.",
      };
    const { data: assurance } =
      await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2")
      return {
        error: "Complete MFA at /admin/mfa before changing your password.",
      };
    const { error } = await db.auth.updateUser({ password: password.data });
    if (error)
      return {
        error:
          "Unable to update the password. Request a new link or check password requirements.",
      };
    await db.auth.signOut();
  } catch {
    return {
      error:
        "Password service is unavailable. Check configuration and try again.",
    };
  }
  redirect("/admin/login?reason=password");
}
export async function logout() {
  const db = await serverClient();
  await db.auth.signOut();
  redirect("/admin/login");
}
