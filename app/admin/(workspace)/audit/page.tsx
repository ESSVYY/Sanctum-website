import Link from "next/link";
import { redirect } from "next/navigation";
import { requireIdentity } from "@/lib/auth/session";
import { CrmShell } from "@/components/crm/shell";
export default async function Audit({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { db, profile } = await requireIdentity();
  if (profile.role !== "SUPER_ADMIN") redirect("/admin/dashboard");
  const { page: raw } = await searchParams;
  const page = Math.max(1, Math.min(100000, Number(raw) || 1));
  const { data, count, error } = await db
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * 30, page * 30 - 1);
  if (error) throw new Error("Unable to load audit trail.");
  return (
    <CrmShell profile={profile} current="audit">
      <h1>Audit logs</h1>
      <p className="crm-subtitle">
        Append-only administrative and record history. Sensitive field values
        are not copied into these logs.
      </p>
      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              {[
                "Time",
                "Action",
                "Entity",
                "Record",
                "Actor",
                "Changed fields",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={row.id}>
                <td>
                  {new Date(row.created_at).toLocaleString("en-NZ", {
                    timeZone: "Pacific/Auckland",
                  })}
                </td>
                <td>{row.action}</td>
                <td>{row.entity_type}</td>
                <td>{row.entity_id ?? "—"}</td>
                <td>{row.actor_id ?? "Server intake"}</td>
                <td>{row.changed_fields.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data?.length && <p className="crm-empty">No audit events yet.</p>}
      <nav className="crm-pagination" aria-label="Audit pages">
        {page > 1 ? (
          <Link href={"?page=" + (page - 1)}>Previous</Link>
        ) : (
          <span />
        )}
        <span>Page {page}</span>
        {page * 30 < (count ?? 0) ? (
          <Link href={"?page=" + (page + 1)}>Next</Link>
        ) : (
          <span />
        )}
      </nav>
    </CrmShell>
  );
}
