import { z } from "zod";

export const categories = [
  "Custom AI",
  "Computer Vision",
  "Predictive Analytics",
  "Automation",
] as const;
export function safeUrl(value: string) {
  if (/[\\\u0000-\u0020\u007f]/.test(value)) return false;
  return (
    /^\/(?!\/)/.test(value) ||
    (/^https:\/\//i.test(value) && URL.canParse(value))
  );
}
export const articleSchema = z.object({
  title: z.string().trim().min(5).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase words separated by hyphens",
    ),
  excerpt: z.string().trim().min(20).max(500),
  content: z.string().trim().min(100).max(100000),
  author: z.string().trim().min(2).max(120),
  category: z.enum(categories),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  cover_image: z
    .string()
    .max(2048)
    .refine((v) => !v || safeUrl(v), "Use an HTTPS URL or a local path"),
  seo_title: z.string().trim().max(200),
  seo_description: z.string().trim().max(500),
  featured: z.boolean(),
  status: z.enum(["draft", "published"]),
});
export type Article = z.infer<typeof articleSchema> & {
  id: string;
  organization_id?: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
export function readingTime(content: string) {
  return Math.max(
    1,
    Math.ceil(content.split(/\s+/).filter(Boolean).length / 220),
  );
}
export function articleDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  }).format(new Date(value));
}
