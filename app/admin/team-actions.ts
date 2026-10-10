"use server";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/session";
import { privilegedClient } from "@/lib/supabase/privileged";
import { canManageRole, isManager, roles } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { siteURL } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import type { MutationState } from "./crm-actions";
export async function inviteStaff(
  _previous: MutationState,
  form: FormData,
): Promise<MutationState> {
  const { db, profile } = await requireIdentity(true);
  const parsed = z
    .object({
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase().trim()),
      name: z.string().trim().min(1).max(200),
      role: z.enum(["ADMIN", "STAFF"]),
    })
    .safeParse(
      Object.fromEntries(
        ["email", "name", "role"].map((key) => [key, form.get(key)]),
      ),
    );
  if (!parsed.success)
    return { error: "Enter a valid name, email and permitted role." };
  if (parsed.data.role === "ADMIN" && profile.role !== "SUPER_ADMIN")
    return { error: "Only a Super Admin can invite an Admin." };
  try {
    const privileged = privilegedClient();
    const redirectTo = `${siteURL()}/auth/confirm`;
    await rateLimit("invite", profile.id, 20);
    const { data: id, error } = await db.rpc("invite_staff", {
      email_input: parsed.data.email,
      name_input: parsed.data.name,
      role_input: parsed.data.role,
    });
    if (error)
      return {
        error:
          "Unable to invite. Check for an existing account or your role permissions.",
      };
    const { error: inviteError } =
      await privileged.auth.admin.inviteUserByEmail(parsed.data.email, {
        redirectTo,
      });
    if (inviteError) {
      await privileged
        .from("staff_invitations")
        .update({ status: "CANCELLED" })
        .eq("id", id)
        .eq("status", "PENDING");
      return {
        error:
          "The invitation could not be sent. Check Supabase email settings and account status.",
      };
    }
  } catch {
    return {
      error:
        "Invitations need server credentials, SITE_URL, rate-limit setup and Supabase email configuration.",
    };
  }
  revalidatePath("/admin/team");
  return {
    message: "Invitation sent. The recipient must set their own password.",
  };
}
export async function manageStaff(
  id: string,
  _previous: MutationState,
  form: FormData,
): Promise<MutationState> {
  const { db, profile } = await requireIdentity(true);
  const next = z.enum(roles).safeParse(form.get("role"));
  if (!z.uuid().safeParse(id).success || !next.success)
    return { error: "Invalid member." };
  const { data: target } = await db
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();
  if (
    !target ||
    !isManager(profile.role) ||
    !canManageRole(profile.role, target.role, next.data)
  )
    return { error: "You cannot change this member’s privileges." };
  const { error } = await db.rpc("manage_staff", {
    target_id: id,
    next_role: next.data,
    next_active: form.get("active") === "true",
  });
  if (error)
    return {
      error:
        "Unable to update access. The last active Super Admin must remain enabled.",
    };
  revalidatePath("/admin/team");
  return { message: "Staff access updated." };
}
