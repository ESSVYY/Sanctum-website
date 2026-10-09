# Sanctum AI website

Sanctum AI is a website for a New Zealand based business automation service serving SMEs and growing companies worldwide. It presents AI-assisted CRM, lead generation, reporting, customer communication, document processing and custom automation services. Visitors can explore solutions, estimate time spent on repetitive work and see how an automated lead-to-report workflow could look.

This repository contains the marketing website and an interactive admin demonstration built with Next.js App Router, React, TypeScript and Tailwind CSS. The homepage lives at `/`; the three-view admin demo lives at `/admin`.

**Current status:** frontend demonstration. The assistant uses canned replies, the admin uses sample records, and booking/request buttons show demo dialogs. External services and a production backend are not connected.

## Website preview

### Desktop homepage

![Sanctum AI desktop homepage with business automation introduction and sample workflow cards](docs/previews/home-desktop.png)

### Admin dashboard

![Sanctum AI sample admin dashboard showing lead metrics, sales funnel and activity feed](docs/previews/admin-desktop.png)

### Mobile homepage

<img src="docs/previews/home-mobile.png" alt="Sanctum AI mobile homepage with navigation menu and demo request buttons" width="320" />

These are screenshots of the running application. No public live-preview URL is configured in this repository. To try it locally, follow the setup below and open `/` or `/admin`.

To refresh the screenshots while the local server is running:

```sh
node tools/capture-preview.mjs
```

Install Playwright Chromium first if needed (`npx playwright install chromium`). The capture script also supports `PREVIEW_BASE_URL` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` environment variables.

## What works now

| Area | Available today |
| --- | --- |
| Marketing website | Services, industries, workflows, capabilities, pricing, process, case-study previews, insights and contact sections |
| Navigation | Section links, mobile menu and a link to the admin demo |
| ROI calculator | Interactive inputs calculating annual hours and estimated labour cost in NZ dollars |
| Assistant | Topic buttons, text input and local sample replies |
| Admin demo | Dashboard, Lead Profile and Automation Health views with sample metrics and records |
| Accessibility basics | Skip links, keyboard focus styles, FAQ disclosures and reduced-motion support |

## What is missing

| Area | Current gap | What needs to be added |
| --- | --- | --- |
| Enquiries and booking | Meeting, demo and audit actions only open demo dialogs | Validated enquiry forms, submission storage, booking integration and confirmation/error states |
| Website content | FAQ answers are placeholders; insights are previews; testimonials and case studies are provisional | Approved FAQ answers, full articles, verified customer stories and final service/pricing copy |
| Legal and company links | Policy and several footer/social destinations open demo dialogs | Approved policy pages, verified company/contact details and real destination URLs |
| Admin access | `/admin` is a public demo with no login or permissions | Authentication, server-side access checks and roles before storing real customer data |
| CRM and leads | Records and metrics are samples; actions do not save changes | Persistent database, lead APIs, validation, search/filtering and working create/update/assign flows |
| Remaining admin screens | Clients, AI Chatbot, Reports and Settings are demo notices | Complete screens connected to real data and services |
| AI assistant | Replies are fixed local text | Server-side AI integration, approved knowledge sources, data-handling rules and failure handling |
| Automations | Workflow statuses, logs and reports are simulated | Workflow execution, authorised CRM/email/WhatsApp integrations, retries, monitoring and report generation |
| Public launch | No live URL is documented; only basic title/description metadata exists | Hosting and domain setup, production configuration, social preview metadata/image, sitemap and robots configuration |
| Operations | Existing checks primarily cover the frontend demo | Backend/integration tests as features are added, CI checks, error monitoring, backups and a broader accessibility review |

## Suggested build order

1. **Make the marketing site ready for launch:** finalise copy, FAQs, pricing, policies and verified case studies; replace demo destinations with working links.
2. **Make enquiries work:** connect demo/audit forms and booking, save submissions, and show confirmation and failure states.
3. **Build a secure admin foundation:** add login, roles, a database and real lead management, then implement the remaining admin screens.
4. **Connect automation and AI:** integrate the chosen business tools, add workflow monitoring and reports, and replace canned assistant replies with a backend service.
5. **Publish and maintain:** configure hosting/domain, SEO and social previews, CI, monitoring and backups; run production and accessibility checks.

These are planned additions, not completed features. Provider choices and business-approved content are still needed to implement them.

## Run locally

Use Node.js 20.19+ or a current supported LTS release.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Production preview: `npm run build`, then `npm run start`.

## Implemented

- All 16 homepage sections, navigation, service ticker and footer, preserving reference copy, SVGs, diagrams, colours and desktop layout.
- Dashboard, Lead Profile and Automation Health, with the supplied sample metrics, Sarah Mitchell record, AI summary, timeline, workflow statuses and WIP summary.
- Floating assistant with eight topics, message input, local canned replies, Escape/close behaviour and keyboard focus handling.
- ROI ranges with their supplied limits and steps; annual hours = employees × hours × repetitions; annual labour cost = hours × hourly rate. Default: 1,040 hours and NZ$36,400. The visual opportunity meter uses an illustrative NZ$200,000 scale inferred from the captured default; it is not a business prediction.
- Section links, mobile navigation, FAQ disclosures, visible focus states and reduced-motion support.

## Verification

```sh
npm run build
npm run typecheck
npm run lint
npx playwright install chromium
npm test
```

The browser configuration uses an existing Windows Chromium cache when available; otherwise install Playwright Chromium with the command above. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override the browser location.

Six browser checks cover homepage controls, the three admin views and website return, responsive layouts at 375/768/1440 pixels, and desktop section captures. Screenshots are saved to `reference/` for comparison. Desktop imagery was compared with all supplied section references, including the assistant and admin views. Mobile and tablet layouts are adaptations because no corresponding references were supplied.

## Reference handling and remaining differences

`components/reference-sections.tsx` contains React server components converted from the supplied rendered HTML, without scripts, Figma chrome, capture overlays or iframes. `app/reference.css` preserves the supplied CSS; `app/globals.css` adds interactive styles and responsive adaptations. The supplied fonts are hosted in `public/fonts/`.

`tools/import_reference.py` documents the conversion and uses the original local attachment path. It is not needed to run or build the app. To regenerate, install Python BeautifulSoup/html5lib, point `SOURCE` at the supplied HTML, run the importer and `node tools/format-reference.mjs`. The font download helper is also optional and is not invoked by the app.

Original React source was unavailable. Admin spacing and icons are reconstructed from screenshots. Exact screenshot viewport/zoom and animation positions were not supplied; a pixel-perfect match is therefore not claimed. The process-label columns are widened to resolve the reference overlap. On small screens, grids stack, technical flows wrap or turn vertical, hero cards stack, and the admin workflow table scrolls horizontally.

FAQ answer copy was missing: each disclosure explicitly shows an answer placeholder. Insights remain previews without invented articles. Testimonials and case study retain their provisional/template labels. The Automation Health reference says five active automations but lists four active and one paused; the captured heading is preserved alongside a short clarification.

## Demo behaviour and production work

All data and assistant replies are local samples. Captured LIVE/date labels are explicitly qualified as sample data. Meeting, demo, audit, pricing, article and other unseen destinations show a small demo dialog. Admin export, new lead, qualify, assign, meeting, proposal, workflow/log and report controls show demo dialogs; they do not mutate records or call external services. Sidebar screens beyond the three references are not implemented. The supplied email link remains a mailto link.

Production needs approved FAQ/legal/article content, actual testimonials and case studies, authenticated admin access and permissions, persistent CRM/lead storage, validated forms and booking integrations, authorised WhatsApp/email delivery, workflow execution and monitoring, reporting services, and a real AI backend with agreed data handling. No deployment or service integration was performed.

Run a fresh dependency audit before a production release; past audit results do not establish the current dependency status.
