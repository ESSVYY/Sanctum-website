export function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || key.includes("YOUR_"))
    throw new Error("Supabase configuration is incomplete.");
  if (!URL.canParse(url) || new URL(url).protocol !== "https:")
    throw new Error("Invalid Supabase URL.");
  return { url, key };
}
export function isConfigured() {
  try {
    publicConfig();
    return true;
  } catch {
    return false;
  }
}
