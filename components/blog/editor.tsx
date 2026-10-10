"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveArticle } from "@/app/admin/blog-actions";
import { categories, type Article } from "@/lib/blog/schema";
import { Markdown } from "./markdown";
export function BlogEditor({ article }: { article?: Article }) {
  const [state, action, pending] = useActionState(
    saveArticle.bind(null, article?.id || null),
    { id: article?.id, updatedAt: article?.updated_at },
  );
  const [preview, setPreview] = useState(false);
  const [content, setContent] = useState(article?.content || "");
  const [title, setTitle] = useState(article?.title || "");
  // Server Actions reset uncontrolled fields after a returned result. Keep the
  // editor controlled so validation errors and successful saves preserve work.
  const [fields, setFields] = useState<Record<string, string>>({
    slug: article?.slug || "",
    author: article?.author || "Sanctum AI",
    category: article?.category || categories[0],
    tags: article?.tags.join(", ") || "",
    excerpt: article?.excerpt || "",
    cover_image: article?.cover_image || "",
    seo_title: article?.seo_title || "",
    seo_description: article?.seo_description || "",
  });
  const [featured, setFeatured] = useState(article?.featured || false);
  function field(name: string) {
    return {
      value: fields[name],
      onChange: (
        event: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) =>
        setFields((previous) => ({ ...previous, [name]: event.target.value })),
    };
  }
  return (
    <>
      <form action={action} className="crm-form crm-panel">
        <div className="crm-form-grid">
          <label className="crm-wide">
            Title
            <input
              name="title"
              required
              minLength={5}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            URL slug
            <input
              name="slug"
              required
              minLength={3}
              maxLength={160}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              {...field("slug")}
              placeholder="your-article-title"
            />
          </label>
          <label>
            Author attribution
            <input
              name="author"
              required
              minLength={2}
              maxLength={120}
              {...field("author")}
            />
          </label>
          <label>
            Category
            <select name="category" {...field("category")}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Tags (comma separated)
            <input name="tags" maxLength={500} {...field("tags")} />
          </label>
          <label className="crm-wide">
            Excerpt
            <textarea
              name="excerpt"
              required
              minLength={20}
              maxLength={500}
              {...field("excerpt")}
            />
          </label>
          <label className="crm-wide">
            Markdown content
            <textarea
              name="content"
              required
              minLength={100}
              maxLength={100000}
              rows={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
          <p className="crm-wide crm-subtitle">
            Supported: paragraphs, ## headings, ### subheadings, lists,
            **bold**, `code`, fenced code blocks and
            [links](https://example.com). HTML is displayed as text. External
            links and covers must use HTTPS. Cover images are referenced by URL;
            upload them through your existing asset workflow.
          </p>
          <label className="crm-wide">
            Cover image URL or public asset path
            <input
              name="cover_image"
              maxLength={2048}
              {...field("cover_image")}
              placeholder="/images/article-cover.jpg"
            />
          </label>
          <label>
            SEO title (optional)
            <input name="seo_title" maxLength={200} {...field("seo_title")} />
          </label>
          <label>
            SEO description (optional)
            <textarea
              name="seo_description"
              maxLength={500}
              {...field("seo_description")}
            />
          </label>
          <label>
            Feature this article
            <input
              type="checkbox"
              name="featured"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
            />
          </label>
        </div>
        {state.error && (
          <p role="alert" className="crm-error">
            {state.error}
          </p>
        )}
        {state.message && (
          <p role="status" className="crm-notice">
            {state.message}
          </p>
        )}
        <div className="crm-actions">
          <button name="intent" value="draft" disabled={pending}>
            {pending
              ? "Saving…"
              : article?.status === "published"
                ? "Save as draft / Unpublish"
                : "Save draft"}
          </button>
          <button
            name="intent"
            value="publish"
            className="crm-primary"
            disabled={pending}
          >
            {pending ? "Saving…" : "Publish article"}
          </button>
          <button
            type="button"
            aria-expanded={preview}
            onClick={() => setPreview(!preview)}
          >
            Preview current content
          </button>
          {state.id && (
            <Link href={`/admin/blog/${state.id}/preview`}>
              Preview saved article
            </Link>
          )}
          <Link href="/admin/blog">All articles</Link>
        </div>
        <p className="crm-subtitle">
          Publishing makes this content public immediately. Review technical
          claims, attribution and image permissions first. Saving as a draft
          removes it from public pages. Existing publication dates are retained
          when republishing.
        </p>
      </form>
      {preview && (
        <section
          className="blog-editor-preview"
          aria-label="Unpublished content preview"
        >
          <p>Unsaved content preview</p>
          <h2>{title}</h2>
          <Markdown content={content} />
        </section>
      )}
    </>
  );
}
