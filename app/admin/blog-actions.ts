"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/session";
import { articleSchema } from "@/lib/blog/schema";
export type BlogState = {
  error?: string;
  message?: string;
  id?: string;
  updatedAt?: string;
};
export async function saveArticle(
  id: string | null,
  previous: BlogState,
  form: FormData,
): Promise<BlogState> {
  const { db, profile } = await requireIdentity(true);
  if (id && !z.uuid().safeParse(id).success)
    return { error: "Invalid article.", id, updatedAt: previous.updatedAt };
  const input = Object.fromEntries(form);
  const parsed = articleSchema.safeParse({
    ...input,
    featured: form.get("featured") === "on",
    status: form.get("intent") === "publish" ? "published" : "draft",
    tags: String(form.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });
  if (!parsed.success)
    return {
      ...previous,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
      message: undefined,
    };
  const targetId = previous.id || id;
  let query;
  if (targetId) {
    if (!z.uuid().safeParse(targetId).success || !previous.updatedAt)
      return {
        ...previous,
        error: "Reload this article before saving.",
        message: undefined,
      };
    query = db
      .from("blog_posts")
      .update(parsed.data)
      .eq("id", targetId)
      .eq("organization_id", profile.organization_id)
      .eq("updated_at", previous.updatedAt);
  } else {
    query = db
      .from("blog_posts")
      .insert({ ...parsed.data, organization_id: profile.organization_id });
  }
  const { data, error } = await query.select("id,updated_at").maybeSingle();
  if (error)
    return {
      ...previous,
      message: undefined,
      error:
        error.code === "23505"
          ? "That slug is already in use. Choose another URL slug."
          : "Unable to save. Check your access and the blog migration, then try again.",
    };
  if (!data)
    return {
      ...previous,
      message: undefined,
      error:
        "This article changed in another session or is no longer accessible. Reload before saving.",
    };
  revalidatePath("/blog", "layout");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog", "layout");
  return {
    id: data.id,
    updatedAt: data.updated_at,
    message:
      parsed.data.status === "published"
        ? "Article published. It is now publicly readable."
        : "Draft saved. This article is not publicly readable.",
  };
}
