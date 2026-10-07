# Sanctum AI website

A Next.js App Router, React, TypeScript and Tailwind CSS implementation of the supplied Sanctum AI references. The full homepage lives at `/`; the three-view admin demo lives at `/admin`.

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

Dependency audit: the installed runtime dependencies had no reported advisory. npm reported five transitive/development-tool findings rooted in `braces` 3.0.3 through the Next.js ESLint configuration; the registry offered no newer braces release during implementation. Review development tooling updates before production maintenance.
