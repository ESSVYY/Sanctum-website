import Link from "next/link";
import { notFound } from "next/navigation";
import { entityForPath, definitions } from "@/lib/crm/schema";
import { listRecords, pageSize, requestTimestamp } from "@/lib/crm/data";
import { CrmShell } from "@/components/crm/shell";
type Params = {
  q?: string;
  status?: string;
  sort?: string;
  page?: string;
  archived?: string;
};
export default async function Records({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Params>;
}) {
  const { section } = await params;
  const entity = entityForPath(section);
  if (!entity) notFound();
  const filters = await searchParams;
  const { rows, count, page, profile, memberNames } = await listRecords(
    entity,
    filters,
  );
  const now = await requestTimestamp();
  const def = definitions[entity];
  const statusField = def.fields.find(
    (f) => f.key === "status" || f.key === "kind",
  );
  const href = (next: number) => {
    const query = new URLSearchParams(
      Object.entries({ ...filters, page: String(next) }).filter(
        ([, v]) => v !== undefined,
      ) as [string, string][],
    );
    return `/admin/${section}?${query}`;
  };
  return (
    <CrmShell profile={profile} current={section}>
      <div className="crm-heading">
        <div>
          <p className="crm-eyebrow">CRM / {def.title.toUpperCase()}</p>
          <h1>{def.title}</h1>
          <p className="crm-subtitle">
            {count} matching records · Access follows your role and assignments.
          </p>
        </div>
        <div className="crm-actions">
          <Link href={`/admin/${section}/new`}>
            + Add {entity === "deals" ? "deal" : entity.slice(0, -1)}
          </Link>
          {entity === "leads" && (
            <a href="/api/crm/leads/export">Export accessible leads (CSV)</a>
          )}
        </div>
      </div>
      <form className="crm-filters">
        <label>
          Search by name
          <input
            name="q"
            defaultValue={filters.q}
            maxLength={100}
            placeholder="Search records…"
          />
        </label>
        {statusField && (
          <label>
            {statusField.label}
            <select name="status" defaultValue={filters.status ?? ""}>
              <option value="">All</option>
              {statusField.options?.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          Sort by
          <select name="sort" defaultValue={filters.sort ?? "created_at"}>
            {[...new Set(["created_at", "updated_at", ...def.columns])].map(
              (s) => (
                <option value={s} key={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Records
          <select name="archived" defaultValue={filters.archived ?? "no"}>
            <option value="no">Active</option>
            <option value="yes">Archived</option>
          </select>
        </label>
        <button type="submit">Apply filters</button>
        <Link href={"/admin/" + section}>Clear</Link>
      </form>
      {rows.length ? (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <caption className="sr-only">
              {def.title} records, page {page}
            </caption>
            <thead>
              <tr>
                {def.columns.map((c) => (
                  <th scope="col" key={c}>
                    {c.replaceAll("_", " ")}
                  </th>
                ))}
                <th scope="col">Assigned to</th>
                <th scope="col">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  {def.columns.map((c) => (
                    <td key={c}>
                      {c === "status" ? (
                        <span className="crm-badge">{row[c]}</span>
                      ) : c.endsWith("_at") && row[c] ? (
                        <span
                          className={
                            c === "due_at" &&
                            Date.parse(String(row[c])) < now &&
                            row.status !== "DONE"
                              ? "crm-overdue"
                              : ""
                          }
                        >
                          {new Date(String(row[c])).toLocaleDateString(
                            "en-NZ",
                            { timeZone: "Pacific/Auckland" },
                          )}
                        </span>
                      ) : c === "value" ? (
                        Number(row[c]).toLocaleString("en-NZ", {
                          style: "currency",
                          currency: "NZD",
                        })
                      ) : (
                        String(row[c] ?? "—")
                      )}
                    </td>
                  ))}
                  <td>
                    {row.assigned_to === profile.id
                      ? "You"
                      : row.assigned_to
                        ? (memberNames[String(row.assigned_to)] ??
                          "Team member")
                        : "Unassigned"}
                  </td>
                  <td>
                    <Link
                      href={`/admin/${section}/${row.id}`}
                      aria-label={`Open ${row.name}`}
                    >
                      View / edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="crm-empty">
          No matching records. Adjust the filters or add your first record.
        </p>
      )}
      <nav className="crm-pagination" aria-label="Record pages">
        {page > 1 ? <Link href={href(page - 1)}>← Previous</Link> : <span />}
        <span>
          Page {page} of {Math.max(1, Math.ceil(count / pageSize))}
        </span>
        {page * pageSize < count ? (
          <Link href={href(page + 1)}>Next →</Link>
        ) : (
          <span />
        )}
      </nav>
    </CrmShell>
  );
}
