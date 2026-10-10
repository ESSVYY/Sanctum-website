"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/session";
import { isManager } from "@/lib/auth/permissions";
import {
  entities,
  definitions,
  recordSchema,
  type Entity,
} from "@/lib/crm/schema";
export type MutationState = { error?: string; message?: string; id?: string };
export async function saveRecord(
  entity: Entity,
  id: string | null,
  _previous: MutationState,
  form: FormData,
): Promise<MutationState> {
  if (!entities.includes(entity) || (id && !z.uuid().safeParse(id).success))
    return { error: "Invalid record." };
  const { db, profile } = await requireIdentity();
  const input = Object.fromEntries(
    definitions[entity].fields.map((f) => [f.key, form.get(f.key) ?? ""]),
  );
  if (!isManager(profile.role)) {
    if (id) {
      const { data } = await db
        .from(entity)
        .select("assigned_to")
        .eq("id", id)
        .single();
      if (!data) return { error: "Record access is unavailable." };
      input.assigned_to = data.assigned_to ?? "";
    } else input.assigned_to = profile.id;
  }
  const parsed = recordSchema(entity).safeParse(input);
  if (!parsed.success)
    return {
      error: parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    };
  // Empty optional enum/number values use DB defaults on creation.
  const payload = Object.fromEntries(
    Object.entries(parsed.data).filter(
      ([key, value]) =>
        value !== null ||
        !definitions[entity].fields.find((f) => f.key === key)?.options,
    ),
  );
  if (entity === "deals") {
    payload.value ??= 0;
    payload.probability ??= 0;
  }
  if (entity === "leads") {
    payload.source ||= "INTERNAL";
  }
  const query = id
    ? db.from(entity).update(payload).eq("id", id)
    : db.from(entity).insert({
        ...payload,
        organization_id: profile.organization_id,
        created_by: profile.id,
      });
  const { data, error } = await query.select("id").single();
  if (error)
    return {
      error:
        error.code === "23505"
          ? "A matching email already exists. Review the existing record."
          : "Unable to save. Check permissions, linked records and required fields.",
    };
  revalidatePath("/admin", "layout");
  return { message: "Record saved.", id: String(data.id) };
}
export async function archiveRecord(
  entity: Entity,
  id: string,
  form: FormData,
) {
  if (!entities.includes(entity) || !z.uuid().safeParse(id).success) return;
  const { db, profile } = await requireIdentity(true);
  const restore = form.get("restore") === "true";
  const { error } = await db
    .from(entity)
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .single();
  if (error) throw new Error("Unable to change archive status.");
  revalidatePath("/admin", "layout");
}
export async function convertLead(
  id: string,
  _previous: MutationState,
): Promise<MutationState> {
  void _previous;
  const { db } = await requireIdentity();
  if (!z.uuid().safeParse(id).success) return { error: "Invalid lead." };
  const { data, error } = await db.rpc("convert_lead", { lead: id });
  if (error)
    return {
      error:
        "Unable to convert. A matching customer may already exist or your access changed.",
    };
  revalidatePath("/admin", "layout");
  return { message: "Lead converted into a customer.", id: String(data) };
}
export async function markNotification(id: string) {
  const { db, profile } = await requireIdentity();
  if (!z.uuid().safeParse(id).success) return;
  await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("profile_id", profile.id);
  revalidatePath("/admin/dashboard");
}
