import Link from "next/link";
import {
  articleDate,
  readingTime,
  safeUrl,
  type Article,
} from "@/lib/blog/schema";

export function ArticleCard({
  article,
  featured = false,
  preview = false,
}: {
  article: Article;
  featured?: boolean;
  preview?: boolean;
}) {
  return (
    <article className={`insight-card${featured ? " insight-featured" : ""}`}>
      {article.cover_image && safeUrl(article.cover_image) ? (
        <div
          className="insight-cover"
          style={{
            backgroundImage: `url(${JSON.stringify(article.cover_image)})`,
          }}
          role="img"
          aria-label={`Cover for ${article.title}`}
        />
      ) : (
        <div className="insight-art" aria-hidden="true">
          <span>
            {article.category === "Computer Vision"
              ? "VISION"
              : article.category === "Predictive Analytics"
                ? "FORECAST"
                : "ENGINEER"}
          </span>
          <svg viewBox="0 0 300 120">
            <path d="M0 100H300M0 60H300M0 20H300M30 0V120M90 0V120M150 0V120M210 0V120M270 0V120" />
            <path
              className="insight-art-line"
              d={
                article.category === "Predictive Analytics"
                  ? "M30 90L90 75L150 85L210 40L270 20"
                  : "M60 30H240V90H60ZM90 60H210M150 30V90"
              }
            />
          </svg>
        </div>
      )}
      <div className="insight-card-content">
        <p className="editorial-eyebrow">
          {featured ? "FEATURED / " : ""}
          {article.category}
        </p>
        <h2>
          <Link href={`/blog/${article.slug}`}>{article.title}</Link>
        </h2>
        <p>{article.excerpt}</p>
        <ArticleByline article={article} preview={preview} />
        <Link className="insight-read" href={`/blog/${article.slug}`}>
          Read article <span aria-hidden="true">↗</span>
          <span className="sr-only">: {article.title}</span>
        </Link>
      </div>
    </article>
  );
}
export function ArticleByline({
  article,
  preview = false,
}: {
  article: Article;
  preview?: boolean;
}) {
  return (
    <p className="article-byline">
      <span>{article.author}</span>
      <span>
        {preview || !article.published_at ? (
          "Editorial draft"
        ) : (
          <time dateTime={article.published_at}>
            {articleDate(article.published_at)}
          </time>
        )}
      </span>
      <span>{readingTime(article.content)} min read</span>
    </p>
  );
}
export function PreviewNotice() {
  return (
    <p className="editorial-notice" role="status">
      Local content preview — these editorial drafts have not been published.
      Configure Supabase and publish reviewed articles in the admin workspace.
    </p>
  );
}
export function ArticleCta() {
  return (
    <aside className="article-cta">
      <p className="editorial-eyebrow">PUT THE IDEA TO WORK</p>
      <h2>Start with your business problem.</h2>
      <p>Let’s assess your data, workflow and the outcomes that matter.</p>
      <Link
        className="editorial-button"
        href="/contact?service=Custom%20AI%20Engineering"
      >
        Discuss Your AI Project ↗
      </Link>
    </aside>
  );
}
