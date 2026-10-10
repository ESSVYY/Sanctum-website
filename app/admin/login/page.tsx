import Link from "next/link";
import { AuthForm } from "@/components/crm/auth-form";
import { isConfigured } from "@/lib/supabase/config";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <main className="crm-auth">
      <Link href="/" className="crm-brand">
        SANCTUM <span>AI</span>
      </Link>
      <p className="crm-eyebrow">STAFF WORKSPACE</p>
      <h1>Welcome back</h1>
      <p>Invitation-only access to your team’s CRM.</p>
      {reason === "session" && (
        <p role="status">
          Your session expired or access is unavailable. Please sign in again.
        </p>
      )}
      {reason === "password" && (
        <p role="status">Password updated. Sign in with your new password.</p>
      )}
      {reason === "link" && (
        <p className="crm-error" role="alert">
          The link is invalid or expired. Request a new reset or invitation
          email.
        </p>
      )}
      <AuthForm mode="login" configured={isConfigured()} />
      <Link href="/">Return to website</Link>
    </main>
  );
}
