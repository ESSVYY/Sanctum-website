import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { isConfigured, publicConfig } from "@/lib/supabase/config";
import { seedArticles } from "./seed";
import type { Article } from "./schema";

export function previewContentEnabled() {
  return (
    !isConfigured() &&
    (process.env.NODE_ENV === "development" ||
      process.env.BLOG_PREVIEW_CONTENT === "true")
  );
}
export const publishedArticles = cache(
  async (): Promise<{
    articles: Article[];
    unavailable: boolean;
    preview: boolean;
  }> => {
    if (previewContentEnabled())
      return { articles: seedArticles, unavailable: false, preview: true };
    if (!isConfigured())
      return { articles: [], unavailable: true, preview: false };
    // Public reads never inherit an admin session; RLS remains a second boundary.
    const { url, key } = publicConfig();
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
    const { data, error } = await db
      .from("blog_posts")
      .select(
        "id,title,slug,excerpt,content,cover_image,author,category,tags,seo_title,seo_description,featured,status,published_at,created_at,updated_at",
      )
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });
    if (error) {
      console.error("Blog read failed:", error.code);
      return { articles: [], unavailable: true, preview: false };
    }
    return { articles: data as Article[], unavailable: false, preview: false };
  },
);
