# Deployment and compatibility results

## Current result: do not deploy this app to Workers yet

The exact Next.js **16.4.0** application was checked with `@opennextjs/cloudflare` **1.20.9**, its AWS adapter **4.1.8**, Wrangler **4.149.0** and Node **22.23.3**.

| Check                           | Observed result                                                   |
| ------------------------------- | ----------------------------------------------------------------- |
| Native Next.js production build | Passed                                                            |
| Isolated OpenNext build         | Passed; Worker generated                                          |
| Wrangler no-upload dry run      | Passed; gzip bundle 2,945.74 KiB at the time of the probe         |
| Local workerd runtime           | Failed with HTTP 500                                              |
| Failure                         | `Unexpected loadManifest(/.next/server/preview-props.json) call!` |
| Workers security smoke checks   | Four failed because the application could not initialise          |
| Public deployment               | Not attempted                                                     |

The adapter also warned that Node.js middleware/Proxy support is experimental and not maintained as an officially supported OpenNext feature. The build succeeded, but that is insufficient: the local Worker fails before it can serve the website or CRM. Next.js 16.4 is preserved. No adapter source hacks, ignored manifests or framework downgrades were introduced to hide the failure.

The [OpenNext documentation](https://opennext.js.org/cloudflare) describes Next.js 16 support and Windows limitations; the observed runtime error is the practical compatibility blocker for this project. Recheck an adapter release that handles the new preview manifest before selecting Workers for production. The bundle also has little spare room under the documented free Worker size limit; measure again after any dependency or feature changes. Free-tier suitability is not a commitment that all hosting, email, backups and storage remain free.

## Reproduce the compatibility probe safely

The adapter reads `.env*` files and embeds their values in Worker output. Never run a deployable adapter build from a checkout containing `.env.local` or server-secret env files. `tools/check-cloudflare.mjs` refuses those files. The preparation script copies only application source, public assets and build files to an ignored workspace; it does not copy local env files.

With Node 22+:

```sh
node tools/prepare-cloudflare-check.mjs
cd tools/runtime/cloudflare-isolated
npm ci
node tools/check-cloudflare.mjs
npx wrangler deploy --dry-run --config tools/cloudflare-check.jsonc --outdir .open-next/dry-run
npx wrangler dev --local --config tools/cloudflare-check.jsonc --ip 127.0.0.1 --port 3003
```

The probe uses an empty Next config in the isolated workspace because the adapter requires a config file. It supplies no account, domain, production bindings or secrets. Its Worker name is a compatibility label, not a configured production target. These commands create local build output only; the deploy command explicitly uses `--dry-run` and exits without upload.

From the main project, run the smoke checks with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3003` and `npx playwright test tests/security.spec.ts`. A healthy future adapter should serve `/`, `/contact` and `/admin/login`, redirect anonymous CRM requests, reject private APIs and pass the checks. Then separately test real cookie refresh, Auth callbacks, MFA, RLS-backed mutations and file upload/download against staging credentials. Linux/WSL is the preferred environment for a future adapter recheck; this probe was on Windows.

## Commercial alternative: a standard Node 22 host

A host or container service that permits commercial use and runs a persistent Node 22 server can run this app with the native Next.js runtime. This preserves the App Router, Proxy and Server Actions without the failing adapter. Select a suitable provider/plan before deployment; no replacement provider has been configured or purchased here.

On a clean production checkout:

1. Set build-time `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and optional `NEXT_PUBLIC_TURNSTILE_SITE_KEY` through the provider’s environment settings.
2. Run `npm ci`, the documented checks, then `npm run build`.
3. Set server-only `SUPABASE_SECRET_KEY`, `CRM_ORGANIZATION_ID`, `RATE_LIMIT_SECRET`, `SITE_URL` and optional `TURNSTILE_SECRET_KEY` through the provider’s secret/environment settings. Do not put them in public-prefixed variables.
4. Run `npx next start --hostname 0.0.0.0 --port YOUR_PROVIDER_PORT`. The repository’s `npm run start` intentionally binds loopback for local use; use the provider-required interface behind its HTTPS proxy in production.
5. Configure the domain and TLS, Supabase exact Auth URLs/email templates, SMTP delivery, private storage and reviewed migrations as described in [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
6. Make the original public domain the canonical application origin in `SITE_URL`. Forward the original Host consistently so CSRF/origin checks and Auth redirects work. Do not add broad trusted-origin bypasses to make misconfigured proxies pass.
7. Verify anonymous public access, invited staff login/logout, session expiry, MFA, role boundaries, enquiry persistence, CRUD, proposal items, private file links and a restoration drill before directing production traffic to it.

For multiple replicas, share a stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` through server secrets and use a consistent build across instances. Keep authentication routes/private APIs out of shared CDN caches. The CRM is dynamic and its API responses use `private, no-store`. Public cached content must not include cookies or staff data.

The `.github/workflows/ci.yml` workflow checks the native app, input/database policies and public/anonymous browser behaviour. It does not deploy, migrate a live database, test SMTP, configure backups or assert Workers compatibility.

## Future Workers configuration

After a compatible adapter passes runtime and authenticated staging tests, build from a clean Linux checkout. Supply only public build-time variables through CI and put all server credentials into Worker secret bindings at runtime. Choose Worker name, domain, account and port via deployment environment/CLI settings rather than committing production account details. Review current caching/binding requirements in the official [OpenNext setup guide](https://opennext.js.org/cloudflare/get-started).

Do not upload `.env.local`, `.dev.vars`, exported CRM data or local compatibility output. The current probe configuration is not a production deployment configuration, and should not be deployed as one. Deployment access and the final hosting choice remain manual decisions.
