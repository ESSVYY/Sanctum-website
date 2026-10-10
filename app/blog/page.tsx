import type { Metadata } from "next";
import Link from "next/link";
import { publishedArticles, previewContentEnabled } from "@/lib/blog/data";
import { siteUrl } from "@/lib/seo";
import {
  ArticleCard,
  PreviewNotice,
  ArticleCta,
} from "@/components/blog/articles";
export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return {
    title: "Sanctum Insights | Sanctum AI",
    description:
      "Practical insights on artificial intelligence, automation, machine learning and building smarter businesses.",
    alternates: { canonical: siteUrl("/blog") },
    openGraph: {
      title: "Sanctum Insights",
      description: "Practical AI and automation insights for businesses.",
      url: siteUrl("/blog"),
      type: "website",
    },
    robots: previewContentEnabled()
      ? { index: false, follow: false }
      : undefined,
  };
}
export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { articles, preview, unavailable } = await publishedArticles();
  const availableCategories = [
    ...new Set(articles.map((a) => a.category)),
  ].sort();
  const filtered = category
    ? articles.filter((a) => a.category === category)
    : articles;
  const featured = category ? undefined : articles.find((a) => a.featured);
  return (
    <main id="main-content" className="insights-page">
      <div className="editorial-container">
        <p className="editorial-eyebrow">SANCTUM AI / JOURNAL</p>
        <h1>Sanctum Insights</h1>
        <p className="editorial-intro">
          Practical insights on artificial intelligence, automation, machine
          learning and building smarter businesses.
        </p>
        {preview && <PreviewNotice />}
        <nav className="insight-filters" aria-label="Article categories">
          <Link href="/blog" aria-current={!category ? "page" : undefined}>
            All insights
          </Link>
          {availableCategories.map((c) => (
            <Link
              key={c}
              href={`/blog?category=${encodeURIComponent(c)}`}
              aria-current={category === c ? "page" : undefined}
            >
              {c}
            </Link>
          ))}
        </nav>
        {featured && (
          <ArticleCard article={featured} featured preview={preview} />
        )}
        <div className="insights-grid">
          {filtered
            .filter((a) => a.id !== featured?.id)
            .map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                preview={preview}
              />
            ))}
        </div>
        {!filtered.length && (
          <p role="status">
            {unavailable
              ? "Insights are temporarily unavailable. Please check back soon."
              : category
                ? "No articles in this category yet."
                : "New insights are on their way."}
          </p>
        )}
        <ArticleCta />
      </div>
    </main>
  );
}
