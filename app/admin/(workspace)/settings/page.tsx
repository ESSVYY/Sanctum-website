import { requireIdentity } from "@/lib/auth/session";
import { CrmShell } from "@/components/crm/shell";
import { Mfa } from "@/components/crm/mfa";
import Link from "next/link";
export default async function Settings() {
  const { db, profile } = await requireIdentity();
  const { data } = await db.auth.mfa.listFactors();
  const enrolled = data?.totp.some((f) => f.status === "verified");
  return (
    <CrmShell profile={profile} current="settings">
      <h1>Account settings</h1>
      <section className="crm-panel">
        <h2>Your staff account</h2>
        <p>
          {profile.full_name} · {profile.email}
        </p>
        <p>Role: {profile.role.replaceAll("_", " ")}</p>
        <Link href="/admin/forgot-password">Request a password reset</Link>
      </section>
      {enrolled ? (
        <section className="crm-panel">
          <h2>Authenticator enabled</h2>
          <p>
            Your account requires a verified MFA session for CRM access. Contact
            a Super Admin through your team’s verified recovery process if your
            authenticator is lost.
          </p>
        </section>
      ) : (
        <Mfa enroll />
      )}
      <section className="crm-panel">
        <h2>Data and security administration</h2>
        <p>
          Retention, restoration and infrastructure settings are controlled
          through the documented Supabase procedures. Privileged secrets are
          configured on the server.
        </p>
        {profile.role === "SUPER_ADMIN" && (
          <Link href="/admin/audit">Review audit history</Link>
        )}
      </section>
    </CrmShell>
  );
}
