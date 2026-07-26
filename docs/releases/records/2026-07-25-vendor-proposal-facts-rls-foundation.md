# 2026-07-25-vendor-proposal-facts-rls-foundation — Real DB-enforced tenant isolation (PR A)

## Release ID

`2026-07-25-vendor-proposal-facts-rls-foundation`

## Status

`released` — merged to `main` via [#5614](https://github.com/abarva-platform/abarva/pull/5614)
(squash-merge `af83593be5ae6d2c8ffa1f45c735531fc43765bd`), all CI checks passed including "Fresh
Postgres migration replay". Deployed, the governed migration lane applied the RLS/column/trigger
migration (confirmed "No pending migrations" afterward), and the tenant-scoped session mechanism
was live-verified end-to-end against `app.abarva.ai` — both read and a full ingest→accept write
round-trip succeeded through the new `SET LOCAL ROLE authenticated` + RLS-backed path, with all
prior data intact. The existing offline SQL RLS regression suite could not be run in this pass —
see Known Gaps for the two pre-existing tooling blockers found and flagged separately.

## Plain-English Summary

This is PR A of the RLS/tenant-isolation security workstream, sequenced (per `ADR-0013`) to
run before PR 4 stage/artifact contracts: `VendorProposalFact` is now a live, authoritative
data model, so the database-enforced security boundary beneath it should exist before more
product surface is built on top of it.

Scope discovery for this workstream found something broader than expected: RLS is currently
**decorative for essentially all live Source traffic**, not just the one document-evidence
read path the original modernization audit named. A mature, real RLS convention
(`can_read_tenant_by_key()`, applied to 13+ Source tables) already exists in this codebase —
but no live application code path has ever actually switched the Postgres connection into the
restricted `authenticated` role or set the `request.jwt.claims` those policies read. The only
place that full mechanism runs today is an offline SQL regression suite
(`tests/security/rls-regression.sql`), never a real user request. `source_vendor_proposal_facts`
and `source_vendor_proposal_fact_reviews` shipped in PR 3 with `USING (true)` policies —
enabled, but not constraining anything either.

This release fixes both halves for this one flow:

1. **Real RLS policies** on both tables, reusing the existing `can_read_tenant_by_key()`
   convention (not inventing a new one) — `authenticated_read_*`/`authenticated_insert_*` for
   tenant-scoped read/insert, `service_role_all_*` as the documented privileged bypass, no
   authenticated update/delete path (both tables are append-only by app design).
   `source_vendor_proposal_fact_reviews` gains its own `client_key`/`source_event_id` columns
   (denormalized from the parent fact) so it's independently auto-discoverable by the existing
   regression harness, matching every other governed table in this schema.
2. **The tenant-context mechanism** (`src/lib/source/vendor-proposals/tenant-scoped-session.ts`)
   — the first live application code path in this codebase that actually does
   `SET LOCAL ROLE authenticated` + `set_config('request.jwt.claims', ..., true)` per request,
   for the caller's real, server-resolved identity. Built on the codebase's own already-correct
   transactional pattern (`azureSession.ts`'s `createTxSession` — a genuine per-call connection
   checkout wrapped in `BEGIN`/`COMMIT`/`ROLLBACK`), not the shared-singleton, non-transactional
   `postgresCompat.ts` fluent client the module used before this PR.
3. **`vendor-proposal-facts.ts` rewired** to use this session for every query (raw parameterized
   SQL, not the fluent client), with every function now requiring the caller's real identity as
   an explicit parameter — there's no sensible tenant-neutral default for a tenant-scoped write.
   Every query still carries its own explicit `client_key`/`source_event_id` WHERE clause —
   RLS is a second, independent line of defense, not a replacement for the app-layer check.
   `acceptVendorProposalFact`'s multi-step supersession logic now runs inside one real
   transaction (previously sequential awaits on an implicit-autocommit connection) — a genuine
   atomicity improvement, not just a security one.
4. **Immutable ownership**: `BEFORE UPDATE` triggers on both tables reject any change to their
   own tenant/event/vendor/proposal ownership columns — a defense-in-depth backstop, since
   neither table is ever `UPDATE`d by application code today.

## Layer Impact

- `global-control-lane`: a new migration (RLS policies, two new columns, two triggers), a new
  session-mechanism module, and a rewrite of the vendor-proposal-facts repository's internals.
  No product-facing behavior change for any caller — every route's request/response contract
  is unchanged; only the underlying connection/query mechanism changed.
- `client-data-lane`: `source_vendor_proposal_facts`/`source_vendor_proposal_fact_reviews` now
  have a real, live-enforced tenant boundary at the database layer, in addition to the
  application-layer checks that already existed.

## Client Applicability

- All clients: yes — uniform, no tenant-specific behavior.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `supabase/migrations/20260726010000_vendor_proposal_facts_rls.sql` — real RLS policies,
  `client_key`/`source_event_id` columns + backfill on the reviews table, immutable-ownership
  triggers on both tables.
- `src/lib/source/vendor-proposals/tenant-scoped-session.ts` (new) — the tenant-context
  mechanism.
- `src/lib/source/vendor-proposals/vendor-proposal-facts.ts` — rewritten to use raw SQL via
  the new session instead of the `postgresCompat.ts` fluent client; every function now takes
  a required `identity: VendorProposalFactsIdentity` parameter.
- `src/app/api/v1/source/[eventId]/vendor-proposals/[vendorKey]/ingest/route.ts`,
  `.../facts/route.ts`, `.../facts/[factId]/accept/route.ts`, `.../reject/route.ts` — pass the
  caller's real, server-resolved identity (never trusted from the request) to the repository.
- `src/lib/source/agent-generation/context-binder.ts` — same identity-passing update for its
  `getAuthoritativeVendorProposalFacts` call.
- `docs/architecture/adr/ADR-0014-vendor-proposal-facts-rls-tenant-context.md` (new).
- Rewritten/new test files: `vendor-proposal-facts.test.ts`, `tenant-scoped-session.test.ts`
  (new), plus updated route tests for the new 2-argument repository signatures.

## QA / Validation

- `pass` — `vendor-proposal-facts.test.ts` (24 cases, rewritten against the new raw-SQL
  session mechanism): insert, list, accept (including atomic supersession and cross-tenant/
  cross-event denial — now enforced by the WHERE clause itself, not a post-fetch JS check),
  reject, `getAuthoritativeVendorProposalFacts` filtering, and a dedicated test proving the
  tenant-context mechanism actually fires (`set_config('request.jwt.claims', ...)` then
  `SET LOCAL ROLE authenticated`) before every query.
- `pass` — `tenant-scoped-session.test.ts` (new, 3 cases): claims payload matches the real
  identity, `SET LOCAL ROLE authenticated` follows immediately, the caller's function result
  is returned, dedicated `application_name` for connection attribution.
- `pass` — 3 route test suites updated for the new 2-argument repository calls (identity +
  input) — same coverage as before (cross-tenant denial, permission gating, supersession
  detection, malformed content) plus assertions that the real identity (tenantKey/role/userId)
  is what gets passed through.
- `pass` — regression sweep: `context-binder.test.ts` (46/47 — the 1 failure is the same
  pre-existing, unrelated tenantName-derivation bug already present on unmodified `main`,
  confirmed via `git stash` in the prior PR), `prompt-registry.test.ts` — all passing.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — zero errors.
- `pass` — `npx eslint` on all touched/added files — zero errors, zero warnings.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` — 15 release-relevant
  files, this release record found and matched.
- `pass` — all CI checks on PR #5614, including "Fresh Postgres migration replay" (confirms the
  migration SQL — RLS policies, backfill, triggers — is valid against a real Postgres instance).
- `pass` — governed migration lane: `status` → `apply` → `status`, confirmed
  `20260726010000_vendor_proposal_facts_rls.sql` applied ("✓ Applied 1 pending migration"), then
  a clean re-check showed "No pending migrations. Applied: 297 / 293". One unrelated step in the
  same workflow run ("Repository readback — artifact acceptances", a pre-existing verifier for a
  different, earlier feature) failed on a leftover non-idempotent synthetic row — confirmed via
  container log this is unrelated to this migration and flagged as its own follow-up (see Known
  Gaps) rather than silently ignored.
- `pass` — live signed-in proof on `app.abarva.ai` (2026-07-25, post-deploy/post-migration),
  proving the new `SET LOCAL ROLE authenticated` + RLS-backed session doesn't break the feature:
  (a) `GET .../facts` returned `200` with all prior real data intact (the $199,000 accepted fact,
  the $185,000 superseded fact from the PR 3 live-verification session); (b) a full real
  ingest → accept write round-trip (a new "Warranty" fact, ingested then accepted) returned
  `200`/`ok:true`/`reviewStatus: "accepted"` end-to-end.
- `attempted, blocked` — the existing offline SQL RLS regression suite
  (`tests/security/rls-regression.sql`) could not be run in this pass. Two pre-existing,
  unrelated tooling gaps were found and flagged as separate follow-ups (not fixed here, out of
  this PR's scope): (1) the governed ACA operator-job path fails with `ENOENT` because the
  production Docker image doesn't bundle the `tests/` directory the script needs; (2) the
  dedicated `rls-regression.yml` workflow's `lab-control`/`lab-context` targets have no
  configured DSN secrets, and the `production` target failed with a connection error, almost
  certainly because the production Postgres instance sits in a private VNet a GitHub-hosted
  runner cannot reach. The live signed-in proof above is the substitute evidence for this pass.

## Rollout Plan

Merge to `main` via PR, deploy through the repo-owned ACA main deploy workflow. Separately, run
the governed migration lane (`status` then `apply`) to apply the RLS/column/trigger migration.
No product-facing behavior changes for any existing caller — this is purely a security-layer
change beneath an already-shipped, already-tested feature.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none directly; the migration lane is dispatched separately,
  `workflow_dispatch`-only.
- Approved image digest: `sha256:932cac4b6ce2979b3fd9e06c71c84ba381098da56c3c0ff31748eb9203a55e17`
  (`acrabarvalab001.azurecr.io/abarva/web`), deployed via run
  [30179251290](https://github.com/abarva-platform/abarva/actions/runs/30179251290), 100% traffic
  shifted, runtime invariant + health endpoint verified in-workflow.
- ACA runtime invariant: verified — template image, 100%-traffic revision image, and worker job
  images match the digest above.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — captured, see QA / Validation.

## Rollback Plan

Revert the merge commit for the application code. The migration's changes (new columns, new
policies, new triggers) are additive and backward-compatible with the reverted code (the old
`postgresCompat.ts`-based repository would still work against the same table shape, since the
new columns are NOT NULL but have a backfill and no existing caller ever inserted a
`source_vendor_proposal_fact_reviews` row without going through the repository, which always
supplied the fact's client_key/source_event_id in the same request going forward). If a full
schema rollback is ever needed, that is a separate, deliberate destructive-migration decision,
not part of this rollback path.

## Audit Evidence

- PR: [#5614](https://github.com/abarva-platform/abarva/pull/5614), squash-merged
  `af83593be5ae6d2c8ffa1f45c735531fc43765bd`, 2026-07-25.
- Deploy run: [30179251290](https://github.com/abarva-platform/abarva/actions/runs/30179251290).
- Migration-apply run: [30179601682](https://github.com/abarva-platform/abarva/actions/runs/30179601682)
  (migration itself applied cleanly per container log; the run's own reported failure was the
  unrelated, pre-existing artifact-acceptances readback step, see QA / Validation).
- RLS-regression-suite run: attempted, blocked by two pre-existing tooling gaps — see QA /
  Validation and Known Gaps.
- Live proof: captured 2026-07-25 against `app.abarva.ai` — see QA / Validation.
- Baseline audit this release closes items from:
  `docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md` (the raw-`pg.Pool`/vestigial-RLS
  finding).
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md`.
- Design decision: `docs/architecture/adr/ADR-0014-vendor-proposal-facts-rls-tenant-context.md`.

## Known Gaps

- **RLS remains decorative for every other Source table and read/write path.** This release
  fixes the tenant-context mechanism narrowly for the vendor-proposal-facts flow only.
  Generalizing it (retrofitting `postgresCompat.ts` itself, or migrating more Source modules
  onto `azureSession.ts`) is real, valuable, explicitly-named follow-up work — not silently
  implied to be resolved by this PR. `ADR-0004-per-user-rls.md`'s "Phase 5 security closeout"
  should be understood as: real policies + a real offline regression suite exist, but live
  request traffic assuming the restricted role is new as of this release, and only for this
  one flow.
- **PR B's scope is explicitly separate**: `supersedes_fact_id` cross-tenant/event/vendor/
  fact-key consistency (a trigger), the `context-binder.ts` uploaded-evidence join-safety gap
  found during scope discovery (`source_artifact_chunks`/`source_artifact_facts` reads that
  don't re-check tenant at the second join hop), and downstream d16/d19/d22/d24 purity tests
  are not part of this release.
- **PR C's full regression harness (cross-tenant/cross-event/cross-vendor denial suite, UUID-
  guessing non-disclosure, service-role-only-path proof) is not part of this release** — this
  release's own tests cover the mechanism and the existing app-layer behaviors; the dedicated,
  broader security regression harness is PR C's explicit scope.
- **The offline SQL RLS regression suite could not be run against this release** — two
  pre-existing, unrelated tooling gaps were found and flagged as separate follow-ups (not this
  PR's scope to fix): the ACA operator-job path can't reach `tests/security/rls-regression.sql`
  (not bundled in the production image), and the dedicated `rls-regression.yml` workflow's
  `production` target can't reach the private-VNet database from a GitHub-hosted runner (lab
  targets have no configured DSN secrets at all). Live signed-in proof against the real app
  substitutes for this pass; automated regression coverage for the new tables via that suite
  remains open until those gaps are fixed.
- **A pre-existing, unrelated verification step (artifact-acceptances readback) is currently
  broken** — flagged separately; it fails on every `db-migration-lab.yml` dispatch (not just
  this one) due to a leftover non-idempotent synthetic row, unrelated to this migration.
- Connection overhead: every vendor-proposal-facts query now opens a real transaction
  (`BEGIN`/two `SET`s/…/`COMMIT`) instead of a bare pooled query — a small, acceptable latency
  cost for this flow's request volume, not measured/benchmarked in this release.
