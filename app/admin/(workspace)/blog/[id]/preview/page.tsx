import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/session";
import { CrmShell } from "@/components/crm/shell";
import { Markdown } from "@/components/blog/markdown";
import { safeUrl, type Article } from "@/lib/blog/schema";
import "@/app/editorial.css";
export const metadata = {
  title: "Private article preview | Sanctum AI",
  robots: { index: false, follow: false },
};
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { db, profile } = await requireIdentity(true);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await db
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();
  if (error) throw new Error("Unable to load preview.");
  if (!data) notFound();
  const article = data as Article;
  return (
    <CrmShell profile={profile} current="blog">
      <p className="crm-notice">Private editorial preview · {article.status}</p>
      <div className="crm-actions">
        <Link href={`/admin/blog/${id}`}>Back to editor</Link>
      </div>
      <article className="blog-editor-preview">
        <p>
          {article.category} / {article.author}
        </p>
        <h1>{article.title}</h1>
        <p>{article.excerpt}</p>
        {article.cover_image && safeUrl(article.cover_image) && (
          <div
            className="article-cover"
            style={{
              backgroundImage: `url(${JSON.stringify(article.cover_image)})`,
            }}
            role="img"
            aria-label={`Cover for ${article.title}`}
          />
        )}
        <Markdown content={article.content} />
      </article>
    </CrmShell>
  );
}
