"use client";
import { createBrowserClient } from "@supabase/ssr";
import { publicConfig } from "./config";
export function browserClient() {
  const { url, key } = publicConfig();
  return createBrowserClient(url, key);
}
