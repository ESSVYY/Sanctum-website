import "server-only";
export function siteURL() {
  const value = process.env.SITE_URL;
  if (!value || !URL.canParse(value)) throw new Error("SITE_URL is required.");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("Production SITE_URL must use HTTPS.");
  return url.origin;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !URL.canParse(origin)) return false;
  const source = new URL(origin);
  const target = new URL(request.url);
  // Next may normalise a loopback Request URL to localhost. Host still contains
  // the actual incoming authority. Never use untrusted X-Forwarded-Host here.
  const host = request.headers.get("host") ?? target.host;
  const configured = process.env.SITE_URL;
  const scheme =
    source.protocol === target.protocol ||
    (configured &&
      URL.canParse(configured) &&
      origin === new URL(configured).origin);
  return !!scheme && source.host === host && source.origin === origin;
}
export function privateJSON(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
