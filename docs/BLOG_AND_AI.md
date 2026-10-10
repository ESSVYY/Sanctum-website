# Custom AI engineering and Sanctum Insights

The existing homepage and CRM are extended. The calculator, assistant, enquiry
dialog, CRM records and authentication remain in place. No remote schema change,
publication or deployment has been performed.

## Website structure

- The existing AI & ML navigation targets `/#capabilities`. The services section
  also links there. The light engineering section has the six capabilities and
  a **Discuss Your AI Project** CTA.
- Immediately after it: **AI Applied to Real Business Problems**, with three
  explicitly labelled application concepts, then the six-step development process.
- The existing homepage Insights position now uses real article cards.
- `/blog`: Sanctum Insights, featured article, category filters and article cards.
- `/blog/[slug]`: attribution, publication/update dates, reading time, safe Markdown,
  tags, related articles and a contact CTA.
- `/admin/blog`: manager-only article list.
- `/admin/blog/new`, `/admin/blog/[id]`: create/edit, preview, publish and unpublish.
- `/admin/blog/[id]/preview`: authenticated manager-only saved preview.
- `/sitemap.xml`: public pages and currently published articles only.

The solar example is development-inspired; the other applications are conceptual.
No accuracy, customer, engagement or deployment claims have been added. The card
illustrations are abstract diagrams, not project screenshots.

## Supabase setup

1. Finish the existing [Supabase setup](SUPABASE_SETUP.md), including organization,
   staff profiles and Auth configuration. Preserve your existing environment values.
2. Apply **only the new** migration
   `supabase/migrations/202610100001_blog.sql` after the three existing migrations.
   It creates `blog_posts`, indexes, manager and published-reader RLS, an ownership/
   timestamp trigger, and an audit trigger using the existing audit log table.
3. Optionally open `supabase/seeds/blog.sql`, replace
   `REPLACE_WITH_SANCTUM_ORGANIZATION_UUID` with your Sanctum organization ID, and
   execute it in the SQL editor as an authorized database administrator. This
   creates the three educational articles as **drafts**. Re-running it preserves
   existing slugs. It does not choose an organization or publish automatically.
4. Review the drafts and publish through the admin workspace.
5. Set the existing server-only `SITE_URL` to your actual HTTPS origin before
   deployment; it controls canonical, Open Graph and sitemap URLs. No production
   domain is guessed. No additional credentials are required for the blog.

Seed source is `lib/blog/seed.ts`. To regenerate the optional SQL after editing
that source, use `npm run seed:blog:generate`. Routine article editing uses the CMS,
not source files. The seed's placeholder UUID deliberately fails until replaced.

Public database reads use the publishable key and an anonymous, sessionless client.
They additionally filter status and publication time. They never inherit a manager's
session. Drafts are excluded even when an administrator browses the public site.
Public reads include published posts across organizations; this is one site-wide
journal. Slugs are globally unique. Management stays scoped to the manager's own
organization. STAFF can read the same published content as visitors but cannot
read drafts or write articles. Existing active-profile and MFA checks also apply
to direct database operations through the CRM policy helpers.

Article content is rendered as React text and a deliberately limited Markdown
dialect: paragraphs, headings, lists, bold, inline/fenced code and safe links. HTML,
iframes and executable URL schemes are never rendered. Images are cover references
using HTTPS URLs or local public asset paths; no new upload bucket or service key is
needed. Audit logs store changed field names, not content. Concurrent editor saves
use the database update timestamp and reject stale writes.

## Add, edit and publish

Sign in as an active **ADMIN** or **SUPER_ADMIN**, complete MFA if required, then
choose **Insights / Blog** in the workspace sidebar. Select **New article**, enter
title, lowercase hyphenated slug, excerpt, Markdown, author attribution and category.
Optional fields include tags, cover image, SEO overrides and featured placement.
Use the actual author name or the organization attribution; do not invent a person.

**Preview current content** previews unsaved Markdown. **Save draft** stores it
privately; **Preview saved article** opens a protected preview. **Publish article**
makes a reviewed article publicly readable. **Save as draft / Unpublish** removes it
from the public blog, related cards and sitemap. Republishing retains the first
publication date. The editor has no scheduled publishing control. Database rows
with a future publication time stay hidden until that time.

Review the slug before publication; changing it changes the URL and does not create
a redirect for the old URL. If another editor saves first, reload before retrying.
Database failures show an unavailable state; the system never substitutes seed
articles for a configured database failure.

## Local preview

Use Node **22+** (the installed default Node 20 on this machine is too old). The
existing ignored runtime `tools/runtime/node_modules/node/bin/node.exe` is available
on this machine. With a normal Node 22 installation:

```powershell
npm run dev
```

Open `http://127.0.0.1:3000`, `/blog` and an article such as
`/blog/what-is-custom-ai-development`. When Supabase is unconfigured, development
shows clearly labelled editorial preview content. Preview articles have noindex
metadata and are omitted from the sitemap. A normal production server shows an
unavailable state until Supabase is configured and the articles are published.

For an explicit local preview of the production build:

```powershell
npm run build
$env:BLOG_PREVIEW_CONTENT = 'true'
npm run start
```

Do not enable `BLOG_PREVIEW_CONTENT` on production hosting. The flag is ignored
when Supabase is configured. Playwright enables it for its local smoke server;
these preview-specific tests require unconfigured Supabase.

The existing Cloudflare runtime compatibility limitation remains; see
[deployment notes](DEPLOYMENT.md). These changes do not change the hosting adapter.

## Files

New: `components/custom-ai.tsx`, `app/editorial.css`, `components/blog/*`,
`lib/blog/*`, `lib/seo.ts`, `app/blog/*`, `app/sitemap.ts`,
`app/admin/blog-actions.ts`, `app/admin/(workspace)/blog/*`,
`supabase/migrations/202610100001_blog.sql`, `supabase/seeds/blog.sql`,
`tools/generate-blog-seed.mjs`, `tests/blog.spec.ts`, `tests/node/blog.test.ts`,
and this guide.

Modified: `app/page.tsx`, `app/layout.tsx`, `app/contact/page.tsx`,
`components/reference-sections.tsx`, `components/website-interactions.tsx`,
`components/crm/shell.tsx`, `lib/auth/permissions.ts`, `package.json`,
`playwright.config.ts`, `tests/site.spec.ts`, `tests/node/crm-db.test.mjs`, `README.md`.
Existing migrations and environment files have not been changed.

## Verification

Checks completed on 10 October 2026 with the existing local Node 22.23.3 runtime:

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed with Next.js 16.4.0 |
| `npm run test:unit` | 23 tests passed |
| `npm test` | 15 browser tests passed; one gated live CRM test skipped |
| Normal production with preview disabled | Local HTTP check passed: no preview drafts on `/blog` or in the sitemap |
| Visual inspection | Desktop and mobile engineering, blog and article screenshots reviewed; clipped footer corrected |

Preview images: [engineering desktop](previews/custom-ai-desktop.png),
[engineering mobile](previews/custom-ai-mobile.png),
[blog desktop](previews/blog-desktop.png), [blog mobile](previews/blog-mobile.png),
[article desktop](previews/blog-article-desktop.png). Blog images show labelled
local editorial previews, not production publication.

Database tests
execute the actual migrations and draft seed on local PGlite PostgreSQL with the
existing minimal Auth/Storage interfaces. They test anon visibility, STAFF write
denial, ADMIN/SUPER_ADMIN publishing, tenant isolation, MFA, unpublishing and audit
events, alongside the existing CRM checks. They do not emulate Supabase Auth HTTP.

Browser smoke checks cover the public pages at desktop/mobile widths, categories,
article layout, the prefilled enquiry, sitemap exclusion of drafts and anonymous
admin redirects. Live authenticated editor saves and actual Supabase publishing
require configured staging credentials and remain unverified until then.
