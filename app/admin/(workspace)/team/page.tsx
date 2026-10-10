import { requireIdentity } from "@/lib/auth/session";
import { CrmShell } from "@/components/crm/shell";
import { InviteForm, MemberForm } from "@/components/crm/team";
import type { Role } from "@/lib/auth/permissions";
import { requestTimestamp } from "@/lib/crm/data";
export default async function Team() {
  const { db, profile } = await requireIdentity(true);
  const now = await requestTimestamp();
  const [{ data: members, error }, { data: invitations, error: inviteError }] =
    await Promise.all([
      db
        .from("profiles")
        .select("id,full_name,email,role,active")
        .order("created_at"),
      db
        .from("staff_invitations")
        .select("id,email,role,status,expires_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
  if (error || inviteError) throw new Error("Unable to load team.");
  return (
    <CrmShell profile={profile} current="team">
      <h1>Team management</h1>
      <p className="crm-subtitle">
        Admins manage staff. Super Admins manage privileged roles. Changes are
        audited.
      </p>
      <InviteForm role={profile.role} />
      <div className="crm-split">
        {members?.map((member) => (
          <MemberForm
            key={member.id}
            member={{ ...member, role: member.role as Role }}
            actor={profile.role}
          />
        ))}
      </div>
      <section className="crm-panel">
        <h2>Recent invitations</h2>
        {invitations?.length ? (
          <ul className="crm-list">
            {invitations.map((i) => (
              <li key={i.id}>
                {i.email} · {i.role} · {i.status}
                {i.status === "PENDING" && Date.parse(i.expires_at) < now
                  ? " (expired)"
                  : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>No invitations yet.</p>
        )}
      </section>
    </CrmShell>
  );
}
