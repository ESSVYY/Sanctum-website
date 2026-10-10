import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { entityForPath, definitions, type Row } from "@/lib/crm/schema";
import { relationOptions } from "@/lib/crm/data";
import { requireIdentity } from "@/lib/auth/session";
import { isManager } from "@/lib/auth/permissions";
import { CrmShell } from "@/components/crm/shell";
import {
  RecordForm,
  ConvertLead,
  ArchiveButton,
} from "@/components/crm/record-form";
import { ProposalItems } from "@/components/crm/proposal-items";
import { Files } from "@/components/crm/files";
import { CustomerTeam } from "@/components/crm/customer-team";
export default async function RecordPage({
  params,
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const { section, id } = await params;
  const entity = entityForPath(section);
  if (!entity) notFound();
  if (id !== "new" && !z.uuid().safeParse(id).success) notFound();
  const { db, profile } = await requireIdentity();
  const manager = isManager(profile.role);
  let record: Row | undefined;
  if (id !== "new") {
    const { data, error } = await db
      .from(entity)
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) notFound();
    record = data;
  }
  const options = await relationOptions(entity);
  const { count: duplicateCount, error: duplicateError } =
    entity === "leads" && record
      ? await db
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("email", record.email)
          .neq("id", id)
          .is("archived_at", null)
      : { count: 0, error: null };
  if (duplicateError) throw new Error("Unable to check duplicate enquiries.");
  const relationKey =
    entity === "customers"
      ? "customer_id"
      : entity === "leads"
        ? "lead_id"
        : entity === "deals"
          ? "deal_id"
          : entity === "proposals"
            ? "proposal_id"
            : undefined;
  const relatedTables =
    entity === "customers"
      ? ["contacts", "deals", "tasks", "proposals", "activities"]
      : entity === "proposals"
        ? ["activities"]
        : ["tasks", "activities"];
  const related =
    record && relationKey
      ? await Promise.all(
          relatedTables.map(async (table) => {
            const { data, error } = await db
              .from(table)
              .select("id,name,created_at")
              .eq(relationKey, id)
              .is("archived_at", null)
              .order("created_at", { ascending: false })
              .limit(20);
            if (error) throw new Error("Unable to load related records.");
            return { table, rows: data ?? [] };
          }),
        )
      : [];
  const { data: items } =
    entity === "proposals" && record
      ? await db
          .from("proposal_items")
          .select("*")
          .eq("proposal_id", id)
          .order("position")
      : { data: null };
  const { data: files } =
    record && ["customers", "proposals"].includes(entity)
      ? await db
          .from("attachments")
          .select("id,name,size_bytes,uploaded,archived_at")
          .eq(entity === "customers" ? "customer_id" : "proposal_id", id)
          .is("archived_at", null)
      : { data: null };
  const { data: team } =
    entity === "customers" && record
      ? await db
          .from("customer_team")
          .select("profile_id")
          .eq("customer_id", id)
      : { data: null };
  return (
    <CrmShell profile={profile} current={section}>
      <div className="crm-heading">
        <div>
          <p className="crm-eyebrow">
            CRM / {definitions[entity].title.toUpperCase()}
          </p>
          <h1>
            {record
              ? String(record.name)
              : "Add " + (entity === "deals" ? "deal" : entity.slice(0, -1))}
          </h1>
          {record && (
            <p className="crm-detail-meta">
              Created{" "}
              {new Date(String(record.created_at)).toLocaleDateString("en-NZ")}{" "}
              · Last modified{" "}
              {new Date(String(record.updated_at)).toLocaleDateString("en-NZ")}
              {record.archived_at ? " · Archived" : ""}
            </p>
          )}
        </div>
        {record && manager && (
          <ArchiveButton
            entity={entity}
            id={id}
            archived={!!record.archived_at}
          />
        )}
      </div>
      <section className="crm-panel">
        <RecordForm
          entity={entity}
          record={record}
          options={options}
          manager={manager}
          self={profile.id}
        />
      </section>
      {entity === "leads" && record && !record.customer_id && (
        <section className="crm-panel">
          <h2>Customer conversion</h2>
          {!!duplicateCount && (
            <p role="status" className="crm-notice">
              {duplicateCount} other accessible enquiries share this email.
              Review them before creating another customer.
            </p>
          )}
          <p>
            Creates a customer from this lead and marks the lead as won.
            Duplicate customer emails require review.
          </p>
          <ConvertLead id={id} />
        </section>
      )}
      {entity === "leads" && record?.customer_id && (
        <p>
          <Link href={"/admin/customers/" + record.customer_id}>
            Open converted customer
          </Link>
        </p>
      )}
      {entity === "customers" && record && manager && (
        <CustomerTeam
          id={id}
          options={options.profiles ?? []}
          selected={team?.map((t) => t.profile_id) ?? []}
        />
      )}{" "}
      {entity === "proposals" && record && (
        <ProposalItems
          id={id}
          currency={String(record.currency)}
          items={items ?? []}
        />
      )}{" "}
      {record && ["customers", "proposals"].includes(entity) && (
        <Files
          entity={entity as "customers" | "proposals"}
          id={id}
          files={files ?? []}
          manager={manager}
        />
      )}
      <div className="crm-split">
        {related.map(({ table, rows }) => (
          <section className="crm-panel" key={table}>
            <h2>Related {table}</h2>
            {rows.length ? (
              <ul className="crm-list">
                {rows.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/admin/${table === "deals" ? "pipeline" : table}/${row.id}`}
                    >
                      {row.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No related {table} visible to your account.</p>
            )}
            <Link href={`/admin/${table === "deals" ? "pipeline" : table}/new`}>
              Add {table === "activities" ? "activity" : table.slice(0, -1)}
            </Link>
            <p className="crm-detail-meta">
              Shows up to 20 recent records. Use the main list for more.
            </p>
          </section>
        ))}
      </div>
    </CrmShell>
  );
}
