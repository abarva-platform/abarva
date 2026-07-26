# ADR-0014 - Real database-enforced tenant isolation for vendor-proposal facts (PR A)

## Status

Accepted

## Date

2026-07-25

## Context

`ADR-0013-source-modernization-baseline.md` deferred the raw-`pg.Pool`/vestigial-RLS finding
from the Source-vs-Moves audit as its own security-architecture workstream, to run before
PR 4 (stage/artifact contracts) — `VendorProposalFact` is now a live, authoritative data model
(PR 3), so the database-enforced boundary underneath it should exist before more product
surface is built on top of it.

Scope discovery for this workstream (RLS/tenant-isolation, PR A) surfaced a finding broader
than the original audit line: **RLS is currently decorative for essentially all live Source
traffic, not just the document-evidence read path the audit named.** Specifically:

- `source_vendor_proposal_facts` / `source_vendor_proposal_fact_reviews` shipped
  (PR 3) with `USING (true) WITH CHECK (true)` policies — enabled, but not constraining
  anything.
- A mature, real (non-`USING (true)`) RLS convention already exists and is applied to 13+
  other Source tables (`supabase/migrations/20260507100000_rls_role_helpers.sql`,
  `20260507110000_source_per_user_rls_read.sql`, `20260706120000_source_event_facts.sql`):
  `can_read_tenant_by_key(client_key)`, backed by `auth.jwt() ->> 'tenant_key'` reading a
  `request.jwt.claims` Postgres GUC.
- **However, no live application code path today ever sets that GUC or switches the
  connecting role to `authenticated`.** `src/lib/data-plane/postgresCompat.ts` (the fluent
  client `vendor-proposal-facts.ts` used until this PR, and most other Source read/write
  code) holds one shared singleton connection (`max: 1` by default) and issues bare
  `pool.query()` calls with no transaction and no session state at all. A separate,
  correctly-built transactional pattern (`src/lib/data-plane/read-adapters/azureSession.ts`'s
  `createTxSession`) exists and is used by a couple of other modules, but even those only set
  a custom `abarva.actor_user_id` GUC for audit attribution — never `request.jwt.claims`,
  never `SET ROLE authenticated`. The only place the full, real pattern (`SET LOCAL ROLE
authenticated` + `set_config('request.jwt.claims', ..., true)`) is exercised today is the
  offline SQL regression suite (`tests/security/rls-regression.sql`,
  `scripts/run-rls-regression.ts`), which connects with the _same_ `DATABASE_URL` the live app
  uses but is never invoked by a real user request.
- Net effect: the dozens of "real" RLS policies elsewhere in Source are honest, well-designed,
  and completely inert for live traffic today. This is a bigger finding than "these two new
  tables need better policies" — it explains _why_ RLS hasn't been catching anything, and it
  means writing correct policy SQL for `source_vendor_proposal_facts` alone would not have
  been sufficient without also fixing the connection layer for at least this flow.

## Decision

1. **`source_vendor_proposal_facts` and `source_vendor_proposal_fact_reviews` get real,
   tenant-scoped RLS policies**, reusing the existing `can_read_tenant_by_key()` helper — the
   same convention already proven across 13+ other Source tables, picked up automatically by
   the existing auto-discovering regression harness
   (`tests/security/rls-regression.sql`) once these two tables carry a recognized tenant
   column. `source_vendor_proposal_fact_reviews` gains its own denormalized `client_key` +
   `source_event_id` columns (backfilled from the parent fact) rather than a join-based
   policy, matching every other governed table in this schema and making it independently
   auto-discoverable.
2. **`src/lib/source/vendor-proposals/tenant-scoped-session.ts` is the first live application
   code path in this codebase that actually switches the Postgres connection into the
   `authenticated` role and sets `request.jwt.claims`, per request**, for a caller's real,
   server-resolved identity (`requireTenancy()` / `getActiveClientRow()` / `getCurrentUser()`
   — never a client-supplied value). It is built on the already-correct
   `createTxSession` (a genuine per-call `pool.connect()` + `BEGIN`/`COMMIT`/`ROLLBACK`), so
   `SET LOCAL` and `set_config(..., is_local = true)` are transaction-scoped and safe under
   connection-pool reuse — unlike a bare `set_config(..., false)` on a non-transactional,
   pool-shared connection, which would leak across unrelated requests.
3. **`vendor-proposal-facts.ts` is rewired to use this session for every query**, replacing
   the `postgresCompat.ts` fluent client. Every function now takes the caller's real identity
   as an explicit, required parameter (no default) instead of an optional fluent-client
   override — there is no sensible tenant-neutral default for a tenant-scoped write. Every
   query also still carries its own explicit `client_key`/`source_event_id` WHERE clause —
   this is defense _in depth_, RLS is a second, independent enforcement layer, not a
   replacement for the application-layer check that was already there.
4. **A documented `service_role` bypass remains**, matching the established convention
   (`FOR ALL TO service_role USING (true) WITH CHECK (true)`) — for legitimate backend-only
   operations that may need cross-tenant visibility in the future (an ops/admin script, a
   reconciliation job). No live request path in this flow uses it today; all real traffic runs
   as `authenticated`.
5. **Immutable ownership after creation**: `BEFORE UPDATE` triggers on both tables reject any
   change to `client_key`/`source_event_id` (and, on the facts table, `vendor_key`/
   `proposal_artifact_id`) — neither table is ever `UPDATE`d by application code (both are
   append-only ledgers), so this is a pure defense-in-depth backstop against a future bug or
   an ad-hoc `service_role` query silently reassigning a row's tenant/event ownership.
   Cross-table consistency (`supersedes_fact_id` cannot point across a tenant/event/vendor
   boundary) is PR B's scope, not this migration's.
6. **This workstream is scoped to the vendor-proposal-facts flow specifically** — it does not
   retrofit the tenant-context mechanism onto `postgresCompat.ts` itself, and does not touch
   any other Source table's live RLS-enforcement status (all of which remain exactly as
   decorative as they are today). Generalizing this pattern to the rest of Source/the rest of
   the app is real, valuable follow-up work, named explicitly rather than silently implied by
   this PR's narrower scope.

## Amendment (2026-07-25) — PR B: cross-table and cross-event consistency

PR A's RLS policies and immutable-ownership triggers guarantee a row's OWN tenant/event columns
can never change after creation, and that only the caller's real tenant can read/insert rows
tagged with that tenant. Neither guarantees the row's ownership columns were INTERNALLY
CONSISTENT at insert time — a `source_event_id` pointing at a real event belonging to a
different tenant than the row's own `client_key`, or a `supersedes_fact_id` pointing at a fact
from a different tenant/event/vendor/fact-key, would pass PR A's checks (a FK only proves the
referenced row exists, not that its tenant/event match). PR B closes this with `BEFORE INSERT`
trigger functions (`supabase/migrations/20260726020000_vendor_proposal_facts_cross_table_consistency.sql`)
on both tables, verifying: the fact's `client_key` matches its `source_event_id`'s real
`source_events.client_key`; the fact's `proposal_artifact_id` belongs to the same tenant AND
event (not just the same tenant); `supersedes_fact_id` references a fact with the identical
tenant/event/vendor/fact-key (deliberately NOT the same `proposal_artifact_id` — a revision is
expected to come from a different, newer document); and the review row's own tenant/event match
the fact it reviews. This schema has no dedicated vendor/event-vendor authorization table
(`vendor_key` is free-text, matching the rest of Source's vendor-lever fact model) — there is
no vendor-authorization row to check beyond internal consistency, named honestly rather than
fabricating a check against a table that doesn't exist. PR B also closed a join-safety gap found
during scope discovery: `context-binder.ts`'s uploaded-evidence read re-checks `tenant_key` at
BOTH join hops (the `source_artifacts` lookup, and the `artifact_id`-keyed
`source_artifact_chunks`/`source_artifact_facts` reads) — previously the second hop trusted the
first hop's `artifactIds` with no independent tenant check.

## Consequences

- `source_vendor_proposal_facts`/`source_vendor_proposal_fact_reviews` are now the only Source
  tables where RLS is a real, live-traffic-enforced second line of defense, not just an
  enabled-but-inert policy — a meaningfully stronger security posture than the rest of the
  module, on purpose, for the newest and most consequential data model.
- Every vendor-proposal-facts query now opens a real, individually-checked-out transaction
  (via `createTxSession`) instead of a bare pooled query. This is consistent with, not a
  regression from, this repo's own better-practice pattern (`azureSession.ts` already exists
  and is used elsewhere) — it does add one connection round-trip's worth of overhead
  (`BEGIN`/two `SET`/…/`COMMIT`) per call, acceptable for this flow's request volume.
  A real follow-up: retrofitting `postgresCompat.ts` itself (or migrating more Source modules
  onto `azureSession.ts`) would close the same gap everywhere else, but that is a much larger,
  separate undertaking this PR deliberately does not attempt.
- The finding that RLS is decorative for essentially all _other_ Source tables is real and
  should not be treated as resolved by this PR — it's a named, larger follow-up (the rest of
  Source, and the rest of the app, potentially have the exact same gap this ADR found and
  fixed narrowly here).

## Alternatives

- **Write real RLS policies without also fixing the connection layer.** Rejected — this is
  exactly what PR 3 already did (`USING (true)`), and per the scope-discovery finding, even a
  correct policy would be inert without the connecting role ever assuming `authenticated`.
  Writing "better" SQL alone would have been security theater.
- **Retrofit `postgresCompat.ts` globally to assume `authenticated` per request.** Rejected for
  this PR — correct direction, much larger blast radius (every Source table, every existing
  read/write path), and not necessary to close the specific boundary this workstream is
  scoped to (the vendor-proposal-facts flow). Named as real, valuable follow-up work.
- **Use a custom app-specific GUC (`app.tenant_key`) instead of `request.jwt.claims` +
  `SET ROLE authenticated`.** Rejected — this repo already has a mature, tested
  `can_read_tenant_by_key()`/`auth.jwt()` convention exercised by a real regression suite;
  inventing a second, parallel tenant-scoping mechanism would fragment the security model
  rather than extend the one that's already proven.

## Amendment (2026-07-26) — PR C: security regression harness

PR A and PR B built the enforcement (RLS policies, the tenant-context mechanism, the
cross-table consistency triggers); neither shipped an automated regression suite that
attempts real violations and proves they're rejected. `tests/security/rls-regression.sql`
already auto-discovers `source_vendor_proposal_facts`/`_fact_reviews` (both carry a
recognized `client_key` column) and proves plain list-isolation across every canonical
tenant, but that suite is 100% SELECT-only by design — it does not, and by its own safety
contract should not, attempt an INSERT.

PR C adds `tests/security/vendor-proposal-facts-write-isolation-regression.sql` (run via
`scripts/run-vendor-proposal-facts-write-isolation-regression.ts`,
`npm run test:vendor-proposal-facts-write-regression`), the write-path complement: it creates
two synthetic tenants' worth of fixtures inside one transaction, attempts a battery of
adversarial writes as the `authenticated` role scoped to one tenant (cross-tenant
supersession, cross-event fact-planting, cross-tenant artifact citation, cross-vendor
supersession, cross-tenant accept/reject, missing-tenant-context reads, unauthenticated
reads), asserts each is rejected exactly the way a nonexistent target would be rejected (a
trigger exception naming only "does not reference a real X row" — never "belongs to a
different tenant," which would confirm the target exists), and proves the documented
`service_role` bypass still works as a positive control. The whole transaction is always
rolled back — pass or fail — so nothing this suite creates is ever persisted, safe to run
against a lab or production database exactly like `rls-regression.sql`.

This was validated as a REAL detector, not a tautology: run against a live Postgres with the
PR B triggers intact, all 11 scenarios pass; with the trigger functions replaced by
no-op stubs (same names, so the prereq check still finds them), exactly the 5
trigger-dependent scenarios flip to `fail` while the 4 RLS-only scenarios (which don't
depend on the trigger) correctly stay `pass` — proving the suite has real, scenario-specific
detection power rather than a single pass/fail bit.

Wired into `.github/workflows/azure-l5-reset-replay.yml` (the "Fresh Postgres migration
replay" job) as a step immediately after schema verification — this job already provisions a
disposable, fully-migrated ephemeral Postgres per run, which this suite needs and no other CI
lane in this repo reliably provides (the dedicated `rls-regression.yml` workflow's
`lab-control`/`lab-context` targets have no configured secrets, a separate, already-tracked
infra gap this PR does not fix).

Complementing the DB-layer suite, the accept and reject routes each gained a test proving a
caller with no resolvable tenant context at all (the real `requireTenancy()` failure mode for
a missing/invalid session) is denied via `tenancyErrorResponse` (401), and
`tenant-scoped-session.test.ts` gained a test proving `withVendorProposalFactsSession` always
issues the literal `SET LOCAL ROLE authenticated` regardless of `identity.role` — a caller
cannot influence the connecting Postgres role, only the JWT `role` claim, no matter what
string is passed. Cross-tenant accept/reject at the route layer, and the governed-read-contract
exclusions (candidate/rejected/superseded facts, tenant/event-pure downstream context), were
already covered by PR3's and PR B's own tests and are not duplicated here.

## Amendment (2026-07-26) — Workstream closure

The RLS/tenant-isolation security workstream's closure criterion required proof at five
layers: the database-policy layer, the foreign-key/ownership-integrity layer, the application
route layer, the authoritative context-binding layer, and the live multi-tenant production
layer. Status at closure:

- **Database-policy layer**: closed by PR A (real `can_read_tenant_by_key()` RLS policies,
  replacing `USING (true)`) and proven live by `tests/security/rls-regression.sql`'s
  auto-discovery, which now covers both vendor-proposal-facts tables.
- **Foreign-key/ownership-integrity layer**: closed by PR A (immutable-ownership triggers) and
  PR B (cross-table ownership-consistency triggers — event, artifact, and supersession
  consistency).
- **Application route layer**: closed by PR A's tenant-scoped session mechanism (every
  vendor-proposal-facts query now runs as `authenticated`, scoped to the caller's real,
  server-resolved identity) and PR C's route-layer tests (missing-tenant-context denial,
  cross-tenant/cross-event 404 consistency).
- **Authoritative context-binding layer**: closed by PR B's `context-binder.ts` join-safety fix
  (`tenant_key` re-checked at every join hop) and PR3's `getAuthoritativeVendorProposalFacts`
  tests (tenant/event-pure, review-status-filtered reads).
- **Live multi-tenant production layer — partially proven, one documented limitation.**
  Database-layer cross-tenant isolation was proven against two real synthetic tenants in
  Postgres, including negative controls (PR C's
  `vendor-proposal-facts-write-isolation-regression.sql`, run live against a fully migrated
  Postgres, with a validated negative control confirming the suite actually detects a disabled
  trigger rather than passing tautologically). The live application-route proof covered
  same-tenant success, cross-event denial, UUID-guessing indistinguishability, and zero
  partial writes — using two real events under the one tenant session available (same-tenant
  ingest/accept succeeds; a real fact accessed via the wrong event's URL returns the identical
  `404 fact_not_found` as a fabricated, nonexistent UUID; denied attempts leave no partial
  writes; a sibling event's read is completely empty of the other event's facts). **A second
  signed-in tenant session was unavailable** — the app's sign-out control does not work
  (confirmed live, a real defect, tracked separately for a fix) and the agent closing this
  workstream is not permitted to authenticate as a second account itself — so **the live
  app-route cross-tenant check remains an explicitly documented limitation**, not something
  this closure claims to have proven. Per explicit user decision on 2026-07-26, this
  composition of evidence (DB-layer two-tenant proof with negative controls, plus the live
  app-route proof of everything that did not require a second session) is accepted as
  sufficient to close the workstream, with the live app-route cross-tenant gap named honestly
  rather than closed over.

No cross-tenant or cross-event fact can be read, mutated, accepted, rejected, superseded, or
supplied to downstream artifacts through any path tested in PR A, PR B, or PR C — including
when the caller knows the target record's real UUID. This closes the RLS/tenant-isolation
workstream. Per the original sequencing decision, PR 4 (stage and artifact contracts) may now
proceed.

## References

- `docs/architecture/adr/ADR-0004-per-user-rls.md` — the original decision to adopt per-user
  RLS in this codebase; this ADR is the first PR to make that decision actually bind live
  request traffic for a specific flow.
- `docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md` — the original raw-`pg.Pool`
  finding this workstream traces back to.
- `docs/architecture/adr/ADR-0013-source-modernization-baseline.md` — the sequencing decision
  that named this workstream and ordered it before PR 4.
- `supabase/migrations/20260507100000_rls_role_helpers.sql` — the `can_read_tenant_by_key()`
  convention this PR reuses.
- `supabase/migrations/20260726010000_vendor_proposal_facts_rls.sql` — this PR's migration.
- `src/lib/data-plane/read-adapters/azureSession.ts` — the pre-existing, correct transactional
  pattern (`createTxSession`) this PR builds on.
- `src/lib/source/vendor-proposals/tenant-scoped-session.ts` — this PR's tenant-context
  mechanism.
- `tests/security/rls-regression.sql` / `scripts/run-rls-regression.ts` — the existing
  auto-discovering RLS regression suite these two tables now become subject to.
- `supabase/migrations/20260726020000_vendor_proposal_facts_cross_table_consistency.sql` — PR
  B's migration (cross-table ownership-consistency triggers).
- `tests/security/vendor-proposal-facts-write-isolation-regression.sql` /
  `scripts/run-vendor-proposal-facts-write-isolation-regression.ts` — PR C's write-path
  security regression suite.
- `.github/workflows/azure-l5-reset-replay.yml` — where PR C's suite runs, against the
  ephemeral Postgres this job already provisions.
