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
