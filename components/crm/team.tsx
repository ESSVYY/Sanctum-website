"use client";
import { useActionState } from "react";
import { inviteStaff, manageStaff } from "@/app/admin/team-actions";
import { canManageRole, type Role } from "@/lib/auth/permissions";
export function InviteForm({ role }: { role: Role }) {
  const [state, action, pending] = useActionState(inviteStaff, {});
  return (
    <section className="crm-panel">
      <h2>Invite a team member</h2>
      <form className="crm-form" action={action}>
        <div className="crm-form-grid">
          <label>
            Full name
            <input name="name" required maxLength={200} />
          </label>
          <label>
            Email
            <input name="email" type="email" required maxLength={254} />
          </label>
          <label>
            Role
            <select name="role">
              <option>STAFF</option>
              {role === "SUPER_ADMIN" && <option>ADMIN</option>}
            </select>
          </label>
        </div>
        <button className="crm-primary" disabled={pending}>
          {pending ? "Sending…" : "Send invitation"}
        </button>
        {state.error && (
          <p className="crm-error" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="crm-notice" role="status">
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
export function MemberForm({
  member,
  actor,
}: {
  member: {
    id: string;
    full_name: string;
    email: string;
    role: Role;
    active: boolean;
  };
  actor: Role;
}) {
  const [state, action, pending] = useActionState(
    manageStaff.bind(null, member.id),
    {},
  );
  const can = canManageRole(actor, member.role, member.role);
  return (
    <section className="crm-panel">
      <h2>{member.full_name || member.email}</h2>
      <p>{member.email}</p>
      <form action={action} className="crm-form">
        <div className="crm-form-grid">
          <label>
            Role
            <select name="role" defaultValue={member.role} disabled={!can}>
              {(actor === "SUPER_ADMIN"
                ? ["SUPER_ADMIN", "ADMIN", "STAFF"]
                : [member.role]
              ).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Access
            <select
              name="active"
              defaultValue={String(member.active)}
              disabled={!can}
            >
              <option value="true">Active</option>
              <option value="false">Deactivated</option>
            </select>
          </label>
        </div>
        <button disabled={pending || !can}>Update access</button>
        {state.error && (
          <p role="alert" className="crm-error">
            {state.error}
          </p>
        )}
        {state.message && <p role="status">{state.message}</p>}
      </form>
    </section>
  );
}
