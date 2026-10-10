import "server-only";
import { createHmac } from "node:crypto";
import { privilegedClient } from "@/lib/supabase/privileged";
export function abuseKey(value: string) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Rate limiting is not configured.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function rateLimit(scope: string, value: string, max = 10) {
  const { data, error } = await privilegedClient().rpc("consume_rate_limit", {
    key_input: `${scope}:${abuseKey(value)}`,
    max_hits: max,
    window_seconds: 900,
  });
  if (error || data !== true)
    throw new Error("Please wait before trying again.");
}
