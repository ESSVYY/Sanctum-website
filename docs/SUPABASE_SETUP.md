# Sanctum AI CRM setup

The application code is implemented locally. No remote migration, staff provisioning, email delivery, file upload or deployment has been performed. The publishable key is still a placeholder. Complete setup in a staging project, run the live checks, and review the remaining website content before launch.

## Runtime and local configuration

Use Node **22 or newer**. Next.js remains pinned to **16.4.0**. The current Supabase SDK and Wrangler require Node 22. An ignored local runtime was installed at `tools/runtime/node_modules/node/bin/node.exe` for this machine’s checks; it is not a repository dependency or deployment artifact.

`.env.local` was created without replacing existing variables. Insert your publishable key there. Do not paste server secrets into chat, browser code or Git.

| Variable                               | Purpose                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://gnumeujalbqgkzmdzrtt.supabase.co` for the supplied project                                                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key; replace `YOUR_PUBLISHABLE_KEY_HERE` locally                                                              |
| `SUPABASE_SECRET_KEY`                  | Server-only Supabase secret key; a legacy service-role key can also be used here. Required for invitations and public enquiry ingestion |
| `SITE_URL`                             | Exact application origin, e.g. `http://127.0.0.1:3000` locally; HTTPS in production                                                     |
| `CRM_ORGANIZATION_ID`                  | The organization UUID created during initial provisioning                                                                               |
| `RATE_LIMIT_SECRET`                    | A random secret of at least 32 characters; used for keyed hashes of abuse-control identifiers                                           |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`       | Optional public Cloudflare Turnstile site key                                                                                           |
| `TURNSTILE_SECRET_KEY`                 | Optional server-only Turnstile secret; configure both Turnstile values together                                                         |

Generate `RATE_LIMIT_SECRET` with a password manager or Node’s `crypto.randomBytes(32).toString('hex')`, then save the result locally. It is not a Supabase credential. `.env.example` contains safe placeholders. Git ignores all other `.env*` files. Restart the dev server after changing environment variables. Rebuild production after changing `NEXT_PUBLIC_*` values because Next.js embeds them in browser bundles.

```sh
npm ci
npm run dev
```

The public site is `/`, enquiries are `/contact`, staff sign-in is `/admin/login`, and the CRM starts at `/admin/dashboard`. The original sample admin is preserved at `/admin/demo`, with its demonstration labels. It has no access to CRM data.

## Review and apply migrations

This repository does not inspect or reset the remote database. Before applying SQL, inspect the existing schema and take a backup. These migrations create new named objects and deliberately fail on conflicting tables instead of dropping or overwriting them. If your project already contains `profiles`, `leads` or other conflicting objects, reconcile the schema first; do not use `db reset` on the remote project.

Apply, in order, to a separate staging project first:

1. `supabase/migrations/202610090001_crm.sql` — organizations, profiles, staff invitations, customer teams, the CRM tables, constraints, indexes, RLS, guard/audit triggers, role-management and ingestion RPCs.
2. `supabase/migrations/202610090002_storage.sql` — private `crm-files` bucket and storage policies.
3. `supabase/migrations/202610090003_metrics.sql` — RLS-aware dashboard aggregation and atomic proposal line-item replacement.

Each file is transactional. Use Supabase CLI migration tracking for repeatable environments, or paste each complete file into the Supabase SQL Editor and record which versions were applied. Never re-run already applied files as an update; make a new migration for later changes.

With the CLI installed and authenticated, run `supabase init` if CLI configuration is not already present, `supabase link --project-ref YOUR_STAGING_PROJECT_REF`, then review `supabase db push --dry-run` before `supabase db push`. Linking, applying remote migrations and changing project settings are manual infrastructure actions that have **not** been run here.

The database is structured around one organization per staff profile. All records and assignments must belong to that organization. Supabase’s exposed API schema should remain `public`; do not expose `private`. Keep unrelated pre-existing Storage policies under review: permissive existing policies can widen access to a bucket even when the new policies are restrictive.

## Supabase Auth configuration

In Authentication settings:

- Disable public user sign-up. Do not disable the email/password provider; existing and invited users need it.
- Require confirmed email addresses and configure an appropriate password policy. The app’s new-password form requires at least 12 characters.
- Set the production Site URL to the real HTTPS origin.
- Allow exact redirect URLs for `https://YOUR_DOMAIN/auth/confirm` and your local/staging `/auth/confirm` URLs. Avoid broad production wildcards.
- Configure your own SMTP sender for reliable staff invitations and password recovery. The built-in email service has delivery restrictions and rate limits; do not assume it is suitable for commercial launch.
- Enable TOTP MFA. Staff can enrol from Settings; verified factors require an `aal2` session both in the app and database policies.

Configure the **Invite user** email link:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=invite"
  >Set your Sanctum password</a
>
```

Configure the **Reset password** email link:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery"
  >Reset your Sanctum password</a
>
```

The app supplies `/auth/confirm` as `RedirectTo`. Its route accepts only `invite` and `recovery`, verifies the one-time token on the server, sets session cookies and redirects to `/admin/reset-password`. It does not accept arbitrary redirect destinations. Expired links return to sign-in with a generic error. These templates are required; default implicit-flow templates have not been substituted with an insecure URL-token handler.

See the official [SSR auth guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates) and [MFA guide](https://supabase.com/docs/guides/auth/auth-mfa) when configuring the dashboard.

## Provision the first Super Admin

There is no default account, password or bootstrap web endpoint.

1. In the Supabase Auth dashboard, create or invite your own verified staff account. Choose credentials privately. At this point it has no CRM profile and therefore no CRM access.
2. Copy the account’s **Auth user UUID**. Confirm its email is verified.
3. In the SQL Editor, review and run the following transaction, replacing only the UUID placeholder. Use an existing organization UUID instead of creating another organization if you are adding an administrator to an existing organization.

```sql
begin;
do $$
declare
  staff_id uuid := 'REPLACE_WITH_AUTH_USER_UUID';
  org_id uuid;
  account_email text;
begin
  if exists (select 1 from public.profiles where id = staff_id) then
    raise exception 'Account already has a profile; inspect existing access first';
  end if;
  select lower(trim(email)) into account_email
  from auth.users where id = staff_id and email_confirmed_at is not null;
  if account_email is null then raise exception 'Verified Auth account required'; end if;
  insert into public.organizations(name) values ('Sanctum AI') returning id into org_id;
  insert into public.profiles(id, organization_id, email, full_name, role)
  values (staff_id, org_id, account_email, 'Company administrator', 'SUPER_ADMIN');
  insert into public.audit_logs(organization_id, actor_id, action, entity_type, entity_id)
  values (org_id, staff_id, 'INITIAL_PROVISIONING', 'profiles', staff_id);
end $$;
commit;
```

4. Read the profile’s `organization_id` in the dashboard and place it in `CRM_ORGANIZATION_ID` locally and in the production server environment.
5. Sign in, update the administrator’s name through a reviewed SQL change if needed, and enrol an authenticator. Add a second trusted Super Admin only after a verified staff invitation and review.

Normal UI role changes serialize on the organization row and cannot deactivate or demote the last active Super Admin. Supabase project owners have direct database authority, so dashboard/SQL access must itself be restricted.

## Invitation and role workflow

Super Admins can invite Admins or Staff. Admins can invite and activate/deactivate Staff, but cannot edit Admin or Super Admin privileges. Only Super Admins can promote privileged roles. Staff cannot invite or manage accounts.

The app records an invitation with the authenticated caller’s organization and allowed role, then calls Supabase’s admin invite API from a server-only client. The Auth trigger derives the profile from that invitation; it never accepts role/organization values from user metadata. If the email API fails, a pending invitation is cancelled. Duplicate existing Auth accounts may require dashboard review rather than a new invite. An unaccepted, expired invitation can be reissued from Team Management. If a user was created but the email delivery was lost, use the configured password-recovery workflow after verifying account ownership.

Access deactivation is immediate for RLS checks and app requests even if an old JWT has not yet expired. Lost-authenticator recovery is a verified manual administrator process in Supabase, not a self-service MFA bypass. Verified MFA factors require `aal2` even for direct database requests using the publishable key.

## Record access and daily use

Managers see and manage their organization’s records. Staff see explicitly assigned records. A customer may additionally have multiple assigned team members; linked contacts, deals, tasks and proposals retain their own assignments. Assign a related customer to the same staff member/team before expecting them to edit a deal or proposal linked to it.

Create, edit, filter, sort and paginate records from the sidebar. Use the lead status field for `NEW → QUALIFIED → MEETING → PROPOSAL → WON/LOST`. Status changes create activity history. Add notes/calls/meetings through Activities and link them to the appropriate record. Customer and lead detail pages show related records visible to the caller. Related panels show the most recent 20 records; main lists paginate all records. Relationship selection currently loads up to 1,000 accessible choices.

Lead conversion creates a customer and marks the lead won in one transaction. Repeating conversion returns the same customer. Existing customer emails require manual review; conversion never silently merges records the caller cannot access. Customer/contact email uniqueness and normalized emails help detect duplicates; repeated public enquiries are retained as separate leads.

Proposal line items save atomically. Totals are quantity × unit cost in the proposal’s currency. No tax, invoicing, PDF generation, payment processing or automatic sending has been implemented. Marking a proposal SENT records its business status; it does not send email.

Tasks have due dates, priorities, completion states and assignment notifications. Date/time form inputs use **UTC**; dashboard/list date displays use New Zealand time. Notifications are created for task assignments. There is no scheduled email or overdue-reminder service. Overview metrics use database aggregation under the caller’s RLS restrictions, with no sample-number fallback.

## Public enquiry ingestion

Meeting, demo, consultation, project discussion and audit CTAs open the enquiry form. `/contact` provides the same submission flow. Submission creates a `WEBSITE` lead through a server-only RPC. Visitors cannot read leads and anonymous API clients cannot invoke ingestion directly.

The endpoint enforces same-origin requests, a 20 KB request limit, Zod field validation, a honeypot, normalized email and a database-backed per-email limit of five submissions per 15 minutes. A separate global capacity limit permits 100 submissions per organization per 15 minutes. These limits work across server instances, use keyed hashes instead of plaintext abuse identifiers, and can fail closed when the database is unavailable. The global limit intentionally protects capacity but can also be exhausted by abuse; enable Turnstile and provider-level request controls before public launch.

If Turnstile is enabled, configure allowed hostnames, both environment keys and test successful/expired challenges. No calendar booking or confirmation email is claimed: the team follows up on received enquiries. Without setup the form shows a real failure and retains an email fallback instead of claiming a lead was saved.

## Private files

`crm-files` must stay private. The app accepts PDF, PNG, JPEG and UTF-8 text up to 5 MB, checks signatures/encoding, creates metadata and uploads using the signed-in caller’s RLS-enforced client. The bucket also restricts MIME types and size. Files are stored at `organization_uuid/attachment_uuid` rather than a supplied path.

Downloads check attachment and related-record access, then issue a download URL valid for 60 seconds. Treat signed links as bearer links during that interval. Managers can archive attachments; new signed links then fail. Already issued links expire within 60 seconds. Overwrites and direct client deletions are not permitted. Signature validation is not malware scanning; add a scanning/quarantine provider if your risk requirements need it. Incomplete uploads retain metadata and should be cleaned up through a reviewed maintenance process.

## Export, retention, deletion and backups

Lead CSV export includes only records accessible under RLS, quotes fields and neutralizes spreadsheet formulas. It is limited to 100,000 records; larger/full organization exports are a controlled Supabase database export. Do not place exports containing personal data in this repository.

Managers archive records and can restore them through archived lists. Archival is reversible and is **not** physical deletion. Establish a business-approved retention period. For an erasure request, verify the requester and review linked leads, customers, contacts, tasks, deals, proposals, activities and attachments; then perform a scoped maintenance transaction in Supabase. Delete Storage objects using the Storage API before removing their metadata, handle proposal items/customer team links and foreign keys in dependency order, and retain only non-personal audit identifiers when your retention policy permits. No automated purge or legal retention period is implied. Review restored backups against previous deletion requests before returning a restored system to service.

For the free tier, schedule encrypted off-site logical exports with the Supabase CLI, preserve schema/migration versions and verify recoverability. Back up the **file objects separately**; database dumps contain storage metadata, not the files themselves. Also record Auth and project configuration needed for recovery. Keep backup credentials out of Git and give them only to your controlled backup environment. See [Supabase’s backup guidance](https://supabase.com/docs/guides/platform/backups) and its [backup/restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

Run a restoration drill in a new staging project: restore database/auth records according to the official procedure, copy private file objects, configure secrets and Auth URLs, verify record counts, RLS, login, invitations and file downloads, then document recovery time. This repository does not configure a scheduled backup provider, execute a restore, or promise indefinite free service. Monitor the current plan’s limits and upgrade when requirements justify it.

## Testing and troubleshooting

```sh
npm run lint
npm run test:unit
npm run build
npm run typecheck
npx playwright install chromium
npm test
```

The local SQL suite runs migrations in PGlite with minimal Auth/Storage interfaces and distinct PostgreSQL roles. It verifies actual SQL constraints/RLS/RPCs, but it does **not** replace tests of Supabase Auth, SMTP or Storage’s HTTP service.

Live staging tests require `LIVE_E2E_ENABLED=true`, `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD` locally. Use a **disposable staging project**, an assigned test account without MFA for this flow, and working keys/migrations. `npm run test:live` creates customer/task/proposal records and leaves them for staging cleanup. Without those values the test is explicitly skipped. For MFA, invitations, recovery and actual file delivery, run a staging acceptance check with your real email and authenticator; do not use production customer data as fixtures.

| Symptom                            | Check                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Sign-in awaits configuration       | Replace the publishable-key placeholder and restart/rebuild                                            |
| Account has no active staff access | Auth UUID, organization/profile provisioning and `active`; public signup alone never grants CRM access |
| Redirect to MFA                    | Complete the enrolled authenticator challenge; do not weaken RLS to bypass it                          |
| Empty dashboard with no records    | Add or assign records; Staff metrics deliberately exclude other assignments                            |
| Enquiry unavailable                | Server secret, organization UUID, rate-limit secret and migration/RPC grants                           |
| Invitation unavailable             | Server secret, SMTP delivery, exact redirect URL and configured email template                         |
| Related record cannot be edited    | Check organization, record access and parent assignments                                               |
| Upload fails                       | Private bucket migration, size/MIME/signature, parent access and Storage policies                      |
| Node engine warnings               | Upgrade to Node 22+ before installing/building                                                         |
| RLS appears too permissive         | Inspect pre-existing permissive policies and grants, especially on Storage                             |

No passwords, JWTs, server keys or submitted enquiry payloads are intentionally logged by the application. Avoid adding request-body logging to infrastructure or debugging output.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the verified compatibility probe, clean-build procedure, production environment and hosting alternatives. Deployment credentials, domain ownership, remote migrations and email-provider setup remain manual steps.
