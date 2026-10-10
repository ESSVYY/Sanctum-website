# Changelog

## 1.1.0 — 10 October 2026

### Added

- Custom AI engineering capabilities on the homepage: computer vision, predictive
  analytics, custom machine learning, AI agents, document intelligence, and AI
  integration and deployment.
- Three clearly labelled application concepts and a six-step AI development process.
- A **Discuss Your AI Project** CTA connected to the existing enquiry form with
  Custom AI Engineering preselected.
- **Sanctum Insights** at `/blog` and `/blog/[slug]`, with featured articles,
  category filtering, author attribution, publication/update dates, reading times,
  tags, related articles, contact CTAs and responsive article layouts.
- Canonical URLs, Open Graph metadata, Article structured data and a dynamic sitemap.
- Supabase blog storage and manager-only admin editing, private previews, publishing
  and unpublishing. Drafts remain private; STAFF has no publishing privileges.
- Safe Markdown rendering, organization-scoped mutations, MFA-aware RLS, audit
  records and concurrent-edit protection.
- Three educational draft articles covering custom AI development, aerial computer
  vision and demand forecasting, plus an optional draft-only SQL seed.
- Supabase-backed CRM workspace, included in this release from previously
  uncommitted work: leads, customers, contacts, pipeline, tasks, proposals,
  activities, metrics, team management, audit logs and private attachments.
- Staff authentication, recovery and invitations, ADMIN/SUPER_ADMIN/STAFF permissions,
  MFA, organization/assignment access policies and validated public enquiries.
- Local database, validation and browser checks, GitHub CI, setup/deployment
  documentation and desktop/mobile previews.

### Updated

- Existing navigation and homepage Insights cards now lead to the real blog.
- Mobile footer layout corrected while retaining the existing Sanctum branding.
- Original sample admin retained at `/admin/demo`; `/admin` leads to the protected CRM.
- Package version advanced from 1.0.0 to 1.1.0. Environment examples use placeholders;
  local credentials and generated build artifacts remain excluded from Git.

### Verification

- TypeScript, ESLint and the Next.js 16.4.0 production build passed.
- 23 local Node/PostgreSQL tests and 15 browser tests passed.
- One gated live CRM test was skipped because staging credentials are unavailable.
- Desktop/mobile screenshots were reviewed. Normal production with preview disabled
  was checked to keep editorial drafts out of the public blog and sitemap.

### Setup and known limits

- Supabase configuration, remote migrations and staff provisioning are still required.
  Apply the existing CRM migrations and then `202610100001_blog.sql`.
- Replace the organization UUID placeholder in `supabase/seeds/blog.sql` before running
  the optional seed. Review and publish its three drafts through `/admin/blog`.
- Set `SITE_URL` to the actual production origin. Do not enable the local
  `BLOG_PREVIEW_CONTENT` flag on production hosting.
- Live authenticated editor saves, Supabase publishing and deployment have not been
  verified. The previously documented Cloudflare adapter runtime blocker remains.
- Existing content placeholders and demonstration assistant responses still require
  approved content or provider integration; no client results or accuracy metrics
  have been invented.

See [blog and AI setup](docs/BLOG_AND_AI.md), [CRM setup](docs/SUPABASE_SETUP.md)
and [deployment notes](docs/DEPLOYMENT.md).
