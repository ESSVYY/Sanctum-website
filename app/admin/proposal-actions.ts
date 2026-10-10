"use server";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { itemSchema } from "@/lib/crm/schema";
import type { MutationState } from "./crm-actions";
export async function saveItems(
  id: string,
  _previous: MutationState,
  form: FormData,
): Promise<MutationState> {
  const { db } = await requireIdentity();
  if (!z.uuid().safeParse(id).success) return { error: "Invalid proposal." };
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("items")));
  } catch {
    return { error: "Invalid line items." };
  }
  const parsed = z.array(itemSchema).max(100).safeParse(raw);
  if (!parsed.success)
    return {
      error:
        "Use descriptions, positive quantities and non-negative unit costs.",
    };
  const { error } = await db.rpc("replace_proposal_items", {
    proposal: id,
    items: parsed.data,
  });
  if (error)
    return { error: "Unable to save line items. Check proposal access." };
  revalidatePath("/admin/proposals/" + id);
  return { message: "Line items saved." };
}
export async function saveCustomerTeam(
  id: string,
  _previous: MutationState,
  form: FormData,
): Promise<MutationState> {
  const { db } = await requireIdentity(true);
  const members = z.array(z.uuid()).max(100).safeParse(form.getAll("members"));
  if (!z.uuid().safeParse(id).success || !members.success)
    return { error: "Invalid team selection." };
  const { error } = await db.rpc("set_customer_team", {
    customer: id,
    members: members.data,
  });
  if (error) return { error: "Unable to update the customer team." };
  revalidatePath("/admin/customers/" + id);
  return { message: "Customer team updated." };
}
