import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedArticles } from "@/lib/blog/data";
import { siteUrl, jsonLd } from "@/lib/seo";
import { Markdown } from "@/components/blog/markdown";
import {
  ArticleCard,
  ArticleByline,
  ArticleCta,
  PreviewNotice,
} from "@/components/blog/articles";
import { safeUrl } from "@/lib/blog/schema";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
async function getArticle(slug: string) {
  const result = await publishedArticles();
  if (result.unavailable)
    throw new Error(
      "Insights are temporarily unavailable. Please try again later.",
    );
  const article = result.articles.find((a) => a.slug === slug);
  if (!article) notFound();
  return { ...result, article };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article, preview } = await getArticle((await params).slug);
  return {
    title: article.seo_title || `${article.title} | Sanctum AI`,
    description: article.seo_description || article.excerpt,
    alternates: { canonical: siteUrl(`/blog/${article.slug}`) },
    robots: preview ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      url: siteUrl(`/blog/${article.slug}`),
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      authors: [article.author],
      publishedTime: preview ? undefined : article.published_at || undefined,
      modifiedTime: article.updated_at,
      ...(article.cover_image
        ? { images: [siteUrl(article.cover_image)] }
        : {}),
    },
    twitter: {
      card: article.cover_image ? "summary_large_image" : "summary",
      title: article.title,
      description: article.excerpt,
    },
  };
}
export default async function ArticlePage({ params }: Props) {
  const { article, articles, preview } = await getArticle((await params).slug);
  const related = articles
    .filter((a) => a.id !== article.id)
    .sort(
      (a, b) =>
        Number(b.category === article.category) -
        Number(a.category === article.category),
    )
    .slice(0, 3);
  return (
    <main id="main-content" className="insights-page">
      <div className="editorial-container">
        <Link className="insight-read" href="/blog">
          ← All insights
        </Link>
        {preview && <PreviewNotice />}
        <article className="article-layout">
          <header>
            <p className="editorial-eyebrow">{article.category}</p>
            <h1>{article.title}</h1>
            <p className="editorial-intro">{article.excerpt}</p>
            <ArticleByline article={article} preview={preview} />
            {!preview &&
              article.published_at &&
              article.updated_at > article.published_at && (
                <p className="article-byline">
                  Updated{" "}
                  <time dateTime={article.updated_at}>
                    {new Intl.DateTimeFormat("en-NZ", {
                      dateStyle: "long",
                      timeZone: "Pacific/Auckland",
                    }).format(new Date(article.updated_at))}
                  </time>
                </p>
              )}
          </header>
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
          {article.tags.length > 0 && (
            <ul className="article-tags" aria-label="Article tags">
              {article.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <ArticleCta />
        </article>
        {related.length > 0 && (
          <aside className="related-insights">
            <h2>Continue exploring</h2>
            <div className="insights-grid">
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} preview={preview} />
              ))}
            </div>
          </aside>
        )}
        {!preview && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLd({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: article.title,
                description: article.excerpt,
                author: {
                  "@type":
                    article.author === "Sanctum AI" ? "Organization" : "Person",
                  name: article.author,
                },
                publisher: {
                  "@type": "Organization",
                  name: "Sanctum AI",
                  url: siteUrl(),
                },
                datePublished: article.published_at,
                dateModified: article.updated_at,
                mainEntityOfPage: siteUrl(`/blog/${article.slug}`),
                articleSection: article.category,
                keywords: article.tags.join(", "),
                ...(article.cover_image
                  ? { image: siteUrl(article.cover_image) }
                  : {}),
              }),
            }}
          />
        )}
      </div>
    </main>
  );
}
