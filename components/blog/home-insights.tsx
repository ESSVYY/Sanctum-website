import Link from "next/link";
import { publishedArticles } from "@/lib/blog/data";
import { ArticleCard, PreviewNotice } from "./articles";
export async function HomeInsights() {
  const { articles, preview, unavailable } = await publishedArticles();
  return (
    <section
      id="insights"
      className="engineering-section"
      aria-labelledby="insights-title"
    >
      <div className="editorial-container">
        <div className="editorial-heading">
          <div>
            <p className="editorial-eyebrow">IDEAS FOR SMARTER BUSINESSES</p>
            <h2 id="insights-title">Sanctum Insights</h2>
          </div>
          <Link className="editorial-button" href="/blog">
            Explore all insights ↗
          </Link>
        </div>
        <p className="editorial-intro">
          Practical insights on artificial intelligence, automation, machine
          learning and building smarter businesses.
        </p>
        {preview && <PreviewNotice />}
        {articles.length ? (
          <div className="insights-grid">
            {articles.slice(0, 3).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                preview={preview}
              />
            ))}
          </div>
        ) : (
          <p>
            {unavailable
              ? "Insights are temporarily unavailable. Please check back soon."
              : "New insights are on their way."}
          </p>
        )}
      </div>
    </section>
  );
}
