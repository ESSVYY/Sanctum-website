import { notFound } from "next/navigation";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/session";
import { CrmShell } from "@/components/crm/shell";
import { BlogEditor } from "@/components/blog/editor";
import type { Article } from "@/lib/blog/schema";
import "@/app/editorial.css";
export const metadata = {
  title: "Article editor | Sanctum AI",
  robots: { index: false, follow: false },
};
export default async function EditArticle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, profile } = await requireIdentity(true);
  let article: Article | undefined;
  if (id !== "new") {
    if (!z.uuid().safeParse(id).success) notFound();
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();
    if (error)
      throw new Error("Unable to load article. Check the blog migration.");
    if (!data) notFound();
    article = data as Article;
  }
  return (
    <CrmShell profile={profile} current="blog">
      <p className="crm-eyebrow">SANCTUM INSIGHTS / EDITORIAL</p>
      <h1>{article ? "Edit article" : "New article"}</h1>
      <BlogEditor article={article} />
    </CrmShell>
  );
}
