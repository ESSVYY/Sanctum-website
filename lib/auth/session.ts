import "server-only";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
import { roles, type Role, isManager } from "./permissions";
export async function getIdentity() {
  if (!isConfigured()) return null;
  const db = await serverClient();
  const { data: userData, error } = await db.auth.getUser();
  if (error || !userData.user) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("id,organization_id,full_name,email,role,active")
    .eq("id", userData.user.id)
    .single();
  if (!profile?.active || !roles.includes(profile.role)) return null;
  const { data: assurance } =
    await db.auth.mfa.getAuthenticatorAssuranceLevel();
  return {
    db,
    user: userData.user,
    profile: profile as {
      id: string;
      organization_id: string;
      full_name: string;
      email: string;
      role: Role;
      active: boolean;
    },
    needsMfa:
      assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2",
  };
}
export async function requireIdentity(manager = false) {
  const identity = await getIdentity();
  if (!identity) redirect("/admin/login?reason=session");
  if (identity.needsMfa) redirect("/admin/mfa");
  if (manager && !isManager(identity.profile.role))
    redirect("/admin/dashboard?notice=Access%20restricted");
  return identity;
}
