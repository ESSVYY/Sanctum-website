import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "./config";
export function privilegedClient() {
  const { url } = publicConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key || key.includes("YOUR_"))
    throw new Error("Server integration is not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
