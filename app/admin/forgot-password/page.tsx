import { AuthForm } from "@/components/crm/auth-form";
import { isConfigured } from "@/lib/supabase/config";
export default function Forgot() {
  return (
    <main className="crm-auth">
      <p className="crm-eyebrow">SANCTUM AI</p>
      <h1>Reset your password</h1>
      <p>We’ll email a secure reset link to eligible staff accounts.</p>
      <AuthForm mode="forgot" configured={isConfigured()} />
    </main>
  );
}
