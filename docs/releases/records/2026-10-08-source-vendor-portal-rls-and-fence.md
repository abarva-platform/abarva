# Source — row-level security and an enforced data fence for the vendor RFP portal

## Release ID

2026-10-08-source-vendor-portal-rls-and-fence

## Status

Open — not merged, not deployed, not live-proven. The migration is **authored, not applied**.

## Plain-English Summary

Slice **E3** of the Source event lifecycle brief, re-scoped after measurement: the portal's four
tables had no row-level security and no policies, while each one denormalised `tenant_key` with the
comment *"for RLS without a join per row check"*. The intent was in that comment; the SQL was never
written.

This adds it, and adds the control the module needed more.

### What RLS can and cannot fence here

A competing vendor is not a Clerk user and has no database identity. Their requests are served by
the application over the write connection, as `service_role`. **RLS therefore cannot be the fence
that keeps one vendor out of another vendor's row**, because every vendor request arrives as the
role the policy grants in full — by necessity, since only the application can tell two vendors
apart.

So the work splits in two:

1. **RLS closes the tenant direction**, which previously had no control at all: an authenticated
   reader in tenant A must not read tenant B's vendor activity or submissions. Credentials and
   session tokens get **no** tenant policy and no `authenticated` grant, because every row of those
   two tables is a secret.
2. **The vendor direction stays in the application, and is now enforced.** Every statement in
   `dao.ts` is bounded by a `vendor_id` from a verified session, or a `session_token_hash`, or — for
   sign-in alone — `(source_event_id, username)` with a password check. `dao-fence.test.ts` fails
   when a statement addressing a portal table carries none of those.

## Layer Impact

Release lane: **client-data-lane**. Layer 2 (one migration) and the data-access layer. No product
surface changes; no stored value changes.

## Client Applicability

**Not applicable — no client receives this change.** The tables do not exist, because the migration
is unapplied. When the portal does reach a tenant it will be **specific clients** only: a vendor
portal is reachable by the suppliers invited to one solicitation.

## Changes Included

- `supabase/migrations/20261008120000_source_vendor_rfp_portal_rls.sql` — **new**. RLS on all four
  tables; `service_role` full access on each; tenant read policies on activity and submissions only;
  a `SECURITY DEFINER` helper; grants.
- `src/lib/source/vendor-portal/__tests__/dao-fence.test.ts` — **new**, 13 cases.

## QA / Validation

| Check | Status |
|---|---|
| Portal suites | PASS — 4 suites, 54 tests |
| **Both migrations run verbatim against a disposable local Postgres 18** | PASS — exit 0 |
| **Cross-tenant fence, executed** | PASS — see below |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| CI census | PASS — no drift |
| Release check | PASS |
| Migration applied to any real database | **NO** — authored only |
| Signed-in acceptance | NOT RUN |

### The fence was executed, not pattern-matched

A disposable Postgres 18 cluster in a scratch directory, with the dependencies stubbed and **both
real migration files run unmodified**. Two tenants, one event and one vendor each, with activity and
a submission. Then as `authenticated`:

| Reader | Result |
|---|---|
| owner (control — the rows exist) | activity 2, submissions 2 |
| tenant-a | activity 1, **tenant-b leaked 0**; submissions 1, **tenant-b leaked 0** |
| tenant-b | activity 1, **tenant-a leaked 0** |
| either, on `source_event_vendors` | **permission denied** |
| either, on `source_event_vendor_sessions` | **permission denied** |
| a row whose `tenant_key` disagrees with its event's `client_key` | visible to **neither** tenant |

The cluster was stopped and deleted afterwards. No tenant database was touched.

### Running it found a bug that no amount of reading would have

The first version of the activity policy checked the row's event with an inline
`EXISTS (... FROM source_event_vendors v JOIN source_events se ...)`. A policy's `USING` clause is
evaluated with the **caller's** privileges, and `authenticated` must never hold `SELECT` on
`source_event_vendors` — every row is a credential. So the policy was **unsatisfiable**: it raised
`permission denied for table source_event_vendors` for every authenticated reader, and the table
would have read as empty-or-broken rather than fenced.

It now goes through `vendor_portal_activity_in_tenant(...)`, `SECURITY DEFINER`, returning a boolean
and never a row, with `search_path` pinned to `public, pg_temp` and `EXECUTE` revoked from `PUBLIC`.

A second, smaller instrument error: the mismatched-row check first counted
`WHERE tenant_key = 'tenant-b'`, which tenant-b satisfies with its own legitimate row, so the
count of 1 said nothing. Re-queried by `blob_path`, which showed tenant-b sees only its own.

### Mutation results — 11 of 11 killed

| Mutation | Result |
|---|---|
| a new query with no bound at all | killed — 4 cases |
| a new query bounded only by `tenant_key` | killed |
| session resolver stops pinning `source_event_id` | killed |
| session resolver accepts a caller-supplied `vendorId` | killed |
| `ENABLE ROW LEVEL SECURITY` commented out on one table | killed |
| a tenant read policy added on the credentials table | killed |
| an `authenticated` grant added on the credentials table | killed |
| submissions policy stops checking the event's key | killed |
| activity policy stops checking the event at all | killed |
| the definer helper loses its pinned `search_path` | killed |
| the definer helper left callable by `PUBLIC` | killed |

**One of those started as a survivor.** Commenting out `ENABLE ROW LEVEL SECURITY` passed, because
the assertion matched the raw file and the asserted substring was still present *inside the
comment*. A guard over SQL that does not strip comments asserts nothing about SQL. The suite now
strips SQL comments first, and the stripper has five of its own cases — including that a `--` inside
a string literal is left alone, and that length is preserved so a reported offset still lands on
real SQL.

## Rollout Plan

Merge. The routes and the data layer are inert until the migration is applied, and they are inert
**fail-closed**: with the tables absent, `findVendorForSignIn` returns null, the constant-time dummy
hash path runs, and sign-in answers `401 invalid_credentials`. Nobody signs in. That was read in the
route, not assumed.

Migration application is a separate authorized request and is not sought here.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command. No migration applied.

## Rollback Plan

Revert. The portal tables return to having no row-level security, and the DAO's fence returns to
being a comment rather than a test. Nothing stored changes either way, because the tables do not yet
exist.

## Audit Evidence

- Both migrations executed against a disposable cluster, exit 0, with the fence results tabulated
  above and an owner-level control proving the rows existed to be hidden.
- 11 mutations, each killed, including two on the `SECURITY DEFINER` helper's own hardening.
- The comment-stripper that closed the one survivor is itself covered by five cases.

## Known Gaps

- **E2 and E4 remain.** The event-vendor row still carries a free-text supplier name rather than a
  reference to the accepted candidate's `vendor_id`, and invitations are not yet derived from a
  persisted RFx package version.
- **`revokeSession` is bounded only by the token hash.** That is the bearer secret, so holding it is
  already proof of possession — but a caller who obtained another vendor's hash could revoke that
  session. Narrowing it to `(session_token_hash, vendor_id)` is a small follow-on; it is listed in
  the fence test's accepted bounds today rather than silently ignored.
- **No tenant-side read path for vendor identity exists.** Credentials are correctly unreadable to
  `authenticated`, which means a staff-facing list of invited vendors needs a view that excludes the
  credential columns. Not built here.
- The disposable-database proof used **stubbed** dependencies for `source_events`,
  `can_read_tenant_by_key` and the pricing-submissions table. The policies are real; their
  surroundings were minimal.
- Not applied, not deployed, not live-proven.
