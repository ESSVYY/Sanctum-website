import { writeFile, mkdir } from "node:fs/promises";
import { seedArticles } from "../lib/blog/seed.ts";
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
const statements = seedArticles
  .map(
    (
      a,
    ) => `insert into public.blog_posts(id,organization_id,title,slug,excerpt,content,author,category,tags,featured,status)
values(${quote(a.id)}::uuid,target_org,${quote(a.title)},${quote(a.slug)},${quote(a.excerpt)},${quote(a.content)},${quote(a.author)},${quote(a.category)},array[${a.tags.map(quote).join(",")}],${a.featured},'draft') on conflict(slug) do nothing;`,
  )
  .join("\n\n");
await mkdir(new URL("../supabase/seeds/", import.meta.url), {
  recursive: true,
});
await writeFile(
  new URL("../supabase/seeds/blog.sql", import.meta.url),
  `-- Optional editorial drafts. Apply the blog migration first.
-- Replace the placeholder with Sanctum's organization UUID before running.
-- Existing slugs are preserved; this does not publish or overwrite articles.
do $seed$
declare target_org uuid := 'REPLACE_WITH_SANCTUM_ORGANIZATION_UUID'::uuid;
begin
if not exists(select 1 from public.organizations where id=target_org) then
  raise exception 'Choose an existing Sanctum organization UUID';
end if;
${statements}
end $seed$;\n`,
);
console.log("Generated supabase/seeds/blog.sql (three drafts).");
