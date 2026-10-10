import type { MetadataRoute } from "next";
import { publishedArticles } from "@/lib/blog/data";
import { siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articles, preview } = await publishedArticles();
  return [
    { url: siteUrl(), priority: 1 },
    { url: siteUrl("/contact"), priority: 0.8 },
    { url: siteUrl("/blog"), priority: 0.7 },
    ...(!preview
      ? articles.map((a) => ({
          url: siteUrl(`/blog/${a.slug}`),
          lastModified: a.updated_at,
          priority: 0.6,
        }))
      : []),
  ];
}
