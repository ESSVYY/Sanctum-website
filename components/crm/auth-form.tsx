"use client";
import Link from "next/link";
import { useActionState } from "react";
import {
  authenticate,
  resetPassword,
  type AuthState,
} from "@/app/admin/auth-actions";
export function AuthForm({
  mode,
  configured,
}: {
  mode: "login" | "forgot" | "reset";
  configured: boolean;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "reset" ? resetPassword : authenticate.bind(null, mode),
    {},
  );
  return (
    <form action={action} className="crm-form">
      {!configured && (
        <p role="status">
          Staff sign-in is awaiting Supabase configuration. Contact your site
          administrator.
        </p>
      )}
      {mode !== "reset" && (
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            maxLength={254}
          />
        </label>
      )}
      {mode !== "forgot" && (
        <label>
          {mode === "reset" ? "New password" : "Password"}
          <input
            type="password"
            name="password"
            autoComplete={
              mode === "reset" ? "new-password" : "current-password"
            }
            required
            minLength={mode === "reset" ? 12 : 1}
            maxLength={200}
          />
        </label>
      )}
      {mode === "reset" && (
        <label>
          Confirm password
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
          />
        </label>
      )}
      {state.error && (
        <p className="crm-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p role="status">{state.message}</p>}
      <button className="crm-primary" disabled={pending || !configured}>
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : mode === "forgot"
              ? "Send reset link"
              : "Set password"}
      </button>
      <Link href={mode === "login" ? "/admin/forgot-password" : "/admin/login"}>
        {mode === "login" ? "Forgot your password?" : "Back to sign in"}
      </Link>
    </form>
  );
}
