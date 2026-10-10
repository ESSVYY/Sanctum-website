import { AuthForm } from "@/components/crm/auth-form";
import { isConfigured } from "@/lib/supabase/config";
export default function Reset() {
  return (
    <main className="crm-auth">
      <p className="crm-eyebrow">SANCTUM AI</p>
      <h1>Set your password</h1>
      <p>
        Open your invitation or recovery email first. Use at least 12
        characters.
      </p>
      <AuthForm mode="reset" configured={isConfigured()} />
    </main>
  );
}
