import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (hash && (type === "invite" || type === "recovery")) {
    try {
      const db = await serverClient();
      const { error } = await db.auth.verifyOtp({ token_hash: hash, type });
      if (!error)
        return NextResponse.redirect(
          new URL("/admin/reset-password", request.url),
        );
    } catch {
      /* Expired or unconfigured, use the same public error. */
    }
  }
  return NextResponse.redirect(
    new URL("/admin/login?reason=link", request.url),
  );
}
