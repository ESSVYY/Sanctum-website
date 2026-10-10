import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
import { Mfa } from "@/components/crm/mfa";
export const dynamic = "force-dynamic";
export default async function MfaPage() {
  if (!isConfigured()) redirect("/admin/login");
  const { data } = await (await serverClient()).auth.getUser();
  if (!data.user) redirect("/admin/login");
  return (
    <main className="crm-auth">
      <h1>Multi-factor authentication</h1>
      <Mfa />
    </main>
  );
}
