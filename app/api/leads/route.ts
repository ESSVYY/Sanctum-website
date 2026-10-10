import { z } from "zod";
import { publicLeadSchema } from "@/lib/crm/schema";
import { privilegedClient } from "@/lib/supabase/privileged";
import { abuseKey } from "@/lib/rate-limit";
import { sameOrigin, privateJSON } from "@/lib/http";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return privateJSON({ error: "Invalid request origin." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return privateJSON({ error: "Send a JSON submission." }, 415);
  const reader = request.body?.getReader();
  if (!reader) return privateJSON({ error: "Missing submission." }, 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 20000) {
      await reader.cancel();
      return privateJSON({ error: "Submission is too large." }, 413);
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let input: unknown;
  try {
    input = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return privateJSON({ error: "Invalid submission." }, 400);
  }
  const parsed = publicLeadSchema.safeParse(input);
  if (!parsed.success)
    return privateJSON(
      {
        error:
          "Enter a valid name and email, and a message of 10–5,000 characters.",
      },
      400,
    );
  try {
    const org = z.uuid().parse(process.env.CRM_ORGANIZATION_ID);
    const db = privilegedClient();
    const { data: capacity, error: capacityError } = await db.rpc(
      "consume_rate_limit",
      {
        key_input: "public-lead-capacity:" + org,
        max_hits: 100,
        window_seconds: 900,
      },
    );
    if (capacityError) throw new Error("SETUP");
    if (capacity !== true)
      return privateJSON(
        { error: "Please wait before submitting another enquiry." },
        429,
      );
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (
        !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
        !parsed.data.turnstile_token
      )
        return privateJSON({ error: "Complete the bot verification." }, 400);
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: parsed.data.turnstile_token,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const result = await response.json();
      if (result.success !== true)
        return privateJSON(
          { error: "Bot verification expired. Please try again." },
          400,
        );
    }
    const { website_confirm, turnstile_token, ...lead } = parsed.data;
    void website_confirm;
    void turnstile_token;
    const { error } = await db.rpc("submit_public_lead", {
      org,
      input: lead,
      rate_key: abuseKey(lead.email),
    });
    if (error) {
      if (error.message.includes("RATE_LIMITED"))
        return privateJSON(
          { error: "Please wait before submitting another enquiry." },
          429,
        );
      throw new Error("SUBMISSION");
    }
    return privateJSON(
      {
        message:
          "Your enquiry has been received. The Sanctum AI team will review it.",
      },
      201,
    );
  } catch {
    return privateJSON(
      {
        error:
          "Online enquiries are temporarily unavailable. Please use the email link on the website.",
      },
      503,
    );
  }
}
