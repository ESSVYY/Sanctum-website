import "server-only";
export function siteUrl(path = "/") {
  const origin = process.env.SITE_URL || "http://127.0.0.1:3000";
  const parsed = new URL(origin);
  if (!["http:", "https:"].includes(parsed.protocol))
    throw new Error("SITE_URL must be an HTTP(S) origin");
  return new URL(path, parsed.origin).toString();
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
