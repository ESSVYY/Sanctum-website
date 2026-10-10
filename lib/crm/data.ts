import "server-only";
import { requireIdentity } from "@/lib/auth/session";
import { definitions, type Entity, type Row } from "./schema";
export const pageSize = 20;
export async function requestTimestamp() {
  return Date.now();
}
export async function listRecords(
  entity: Entity,
  params: {
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
    archived?: string;
  },
) {
  const identity = await requireIdentity();
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(params.page)) || 1),
  );
  const allowed = ["created_at", "updated_at", ...definitions[entity].columns];
  const sort = allowed.includes(params.sort ?? "")
    ? params.sort!
    : "created_at";
  let query = identity.db.from(entity).select("*", { count: "exact" });
  if (params.archived === "yes") query = query.not("archived_at", "is", null);
  else query = query.is("archived_at", null);
  if (params.q)
    query = query.ilike(
      "name",
      `%${params.q.slice(0, 100).replaceAll("%", "").replaceAll("_", "")}%`,
    );
  const statusField = definitions[entity].fields.find(
    (f) => f.key === "status" || f.key === "kind",
  );
  if (params.status && statusField?.options?.includes(params.status))
    query = query.eq(statusField.key, params.status);
  const { data, count, error } = await query
    .order(sort, { ascending: sort === "name" })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error("Unable to load CRM records.");
  const { data: members, error: memberError } = await identity.db
    .from("profiles")
    .select("id,full_name,email");
  if (memberError) throw new Error("Unable to load record assignments.");
  const memberNames = Object.fromEntries(
    (members ?? []).map((member) => [
      member.id,
      member.full_name || member.email,
    ]),
  );
  return {
    ...identity,
    rows: (data ?? []) as Row[],
    count: count ?? 0,
    page,
    memberNames,
  };
}
export async function relationOptions(entity: Entity) {
  const { db } = await requireIdentity();
  const relations = [
    ...new Set(
      definitions[entity].fields.flatMap((f) =>
        f.relation ? [f.relation] : [],
      ),
    ),
  ];
  const results = await Promise.all(
    relations.map(async (table) => {
      let query = db
        .from(table)
        .select(table === "profiles" ? "id,full_name,email" : "id,name");
      query =
        table === "profiles"
          ? query.eq("active", true)
          : query.is("archived_at", null);
      const { data, error } = await query.limit(1000);
      if (error) throw new Error("Unable to load linked records.");
      const records = (data ?? []) as unknown as Record<string, string>[];
      return [
        table,
        records.map((row) => ({
          id: String(row.id),
          label:
            table === "profiles"
              ? String(row.full_name || row.email)
              : String(row.name),
        })),
      ] as const;
    }),
  );
  return Object.fromEntries(results);
}
