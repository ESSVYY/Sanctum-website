import { getIdentity } from "@/lib/auth/session";
import { privateJSON } from "@/lib/http";
function csv(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export async function GET() {
  const identity = await getIdentity();
  if (!identity || identity.needsMfa)
    return privateJSON({ error: "Unauthorized" }, 401);
  const columns = [
    "name",
    "email",
    "phone",
    "company",
    "requested_service",
    "status",
    "source",
    "created_at",
  ];
  const rows: string[] = [columns.map(csv).join(",")];
  for (let offset = 0; offset < 100000; offset += 500) {
    const { data, error } = await identity.db
      .from("leads")
      .select(columns.join(","))
      .order("created_at")
      .order("id")
      .range(offset, offset + 499);
    if (error) return privateJSON({ error: "Export unavailable." }, 503);
    for (const row of data ?? [])
      rows.push(
        columns
          .map((key) => csv((row as unknown as Record<string, unknown>)[key]))
          .join(","),
      );
    if ((data?.length ?? 0) < 500) break;
    if (offset === 99500)
      return privateJSON(
        { error: "Export too large. Use a controlled database export." },
        413,
      );
  }
  return new Response("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sanctum-leads.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
