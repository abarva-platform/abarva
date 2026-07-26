# 2026-07-26-vendor-proposal-facts-security-regression-harness — Security regression harness (PR C)

## Release ID

`2026-07-26-vendor-proposal-facts-security-regression-harness`

## Status

`released` — merged, and its own new CI step ("Fresh Postgres migration replay") already ran
green in a real GitHub Actions ephemeral Postgres.

## Plain-English Summary

PR C of the RLS/tenant-isolation security workstream (`ADR-0013`, `ADR-0014`), sequenced
directly after PR A (real RLS + tenant-context mechanism) and PR B (cross-table ownership
consistency). PR A and PR B built the enforcement; this release adds the automated proof that
it actually holds under attack, closing the workstream's explicit "test both direct database
access and the public application routes — route-only tests are not sufficient" requirement.

1. **New direct-database write-path security regression suite**
   (`tests/security/vendor-proposal-facts-write-isolation-regression.sql`, run via
   `npm run test:vendor-proposal-facts-write-regression`). The existing
   `tests/security/rls-regression.sql` already auto-discovers these two tables and proves
   plain list-isolation across every canonical tenant, but it's 100% SELECT-only by design —
   it never attempts a write. This new suite creates two synthetic tenants' worth of fixtures
   in one transaction and attempts, as the `authenticated` role scoped to one tenant: a direct
   known-ID cross-tenant read of a fact and a review (no distinguishing signal vs. a
   nonexistent ID); a cross-tenant supersession attempt; planting a fact into another tenant's
   event; citing another tenant's proposal artifact; superseding a different vendor's fact
   within the _same_ tenant/event (isolating the vendor-key check from RLS-hiding); a
   cross-tenant accept (review-row insert); a read with no tenant context set at all; an
   unauthenticated (`anon` role) read; and a `service_role` bypass positive control. Every
   scenario is asserted, not assumed — the whole transaction is always rolled back regardless
   of outcome, so nothing this suite creates is ever persisted, matching the safety contract
   of the existing suite it complements.
2. **Wired into CI**: a new step in `.github/workflows/azure-l5-reset-replay.yml` ("Fresh
   Postgres migration replay"), immediately after schema verification — this job already
   provisions a disposable, fully-migrated ephemeral Postgres per run, which this suite needs
   and no other CI lane in this repo reliably provides today (the dedicated
   `rls-regression.yml` workflow's `lab-control`/`lab-context` targets have no configured
   secrets — a separate, already-tracked infra gap, not fixed by this release).
3. **Route-layer additions**: the accept and reject routes each gained a test proving a caller
   with no resolvable tenant context at all (the real `requireTenancy()` failure mode for a
   missing/invalid session) is denied via `tenancyErrorResponse` (401) — the accept/reject
   cross-tenant/cross-event 404 path was already covered by PR3's own tests, not duplicated
   here. `tenant-scoped-session.test.ts` gained a test proving
   `withVendorProposalFactsSession` always issues the literal `SET LOCAL ROLE authenticated`
   regardless of `identity.role` — a caller cannot influence the connecting Postgres role,
   only the JWT `role` claim, no matter what string is passed (including the literal string
   `"service_role"`) — the code-level backing for "the service role succeeds only through
   documented server-side paths."

## Layer Impact

- `global-control-lane`: a new offline SQL regression suite + TS runner, a new CI step, and 3
  new/extended test files. No production code path changes — this release is pure test/CI
  infrastructure.

## Client Applicability

- All clients: yes — this is a security regression harness, not tenant-specific behavior.
- Specific clients: none. Internal only: yes (CI/test tooling). Public/demo only: no. Feature
  flag: none.

## Changes Included

- `tests/security/vendor-proposal-facts-write-isolation-regression.sql` (new) — the 11-scenario
  write-path security regression suite.
- `scripts/run-vendor-proposal-facts-write-isolation-regression.ts` (new) — the runner (always
  rolls back, mirrors `run-rls-regression.ts`'s connection/env conventions).
- `package.json` — new `test:vendor-proposal-facts-write-regression` script.
- `.github/workflows/azure-l5-reset-replay.yml` — new step running the suite after schema
  verification; added the new SQL/script files to the `pull_request` path trigger.
- `docs/architecture/adr/ADR-0014-vendor-proposal-facts-rls-tenant-context.md` — PR C
  amendment.
- `src/app/api/v1/source/[eventId]/vendor-proposals/facts/[factId]/accept/__tests__/route.test.ts`
  — new "returns 401 when no tenant context can be established at all" test.
- `src/app/api/v1/source/[eventId]/vendor-proposals/facts/[factId]/reject/__tests__/route.test.ts`
  — same, mirrored.
- `src/lib/source/vendor-proposals/__tests__/tenant-scoped-session.test.ts` — new test proving
  the Postgres ROLE is never derived from `identity.role`.

## QA / Validation

- `pass` — the new SQL suite run live against a real, freshly migrated (295 migrations)
  ephemeral `postgres:16` container (Docker, local): all 11 scenarios passed, and the
  transaction's ROLLBACK was independently confirmed to leave zero fixture rows behind
  (`SELECT count(*) ... WHERE client_key LIKE 'rls-prc-%'` → 0 after a passing run).
- `pass` — **negative-control validation that the suite is a real detector, not a tautology**:
  with the two ownership-consistency trigger functions replaced by no-op stubs (same names, so
  the prereq check still finds them — simulating a real silent regression), exactly the 5
  trigger-dependent scenarios (`s3`, `s4`, `s4b`, `s5`, `s6`) flipped to `fail` with the runner
  exiting 1, while the 4 RLS-only scenarios (`s1`, `s1b`, `s2`, `s7`, `s8`) correctly stayed
  `pass` (they don't depend on the trigger) — the exact selectivity expected if the suite is
  actually exercising what it claims to. Restoring the real trigger SQL brought the suite back
  to GREEN (11/11) immediately, confirming the test DB was left in a clean, correct state.
- `pass` — new route tests (accept + reject, 1 each) and the tenant-scoped-session test (1 new,
  parameterized over 5 role values): `npx jest --testPathPatterns
"vendor-proposals/facts.*(accept|reject)/__tests__/route.test.ts"` → 11/11;
  `vendor-proposal|source/vendor-proposals` sweep → 63/63, zero pre-existing-failure
  regressions introduced.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
tsconfig.json` — zero errors.
- `pass` — `npx eslint` on all touched/added files — zero errors, zero warnings.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` — Release Control
  Gate, Azure deployment lane check, Deploy Authority Gate, Pilot Data Loader Gate all passed.
- `pass` — CI on PR #5631 (all checks), including the new "Fresh Postgres migration replay"
  step running for the first time in a real GitHub Actions ephemeral Postgres (workflow run
  [30182625608](https://github.com/abarva-platform/abarva/actions/runs/30182625608)) — the
  authoritative confirmation that the suite runs correctly outside the local Docker validation
  above.
- `pass` (partial, with a documented limitation) — the workstream's live multi-tenant
  production proof. Database-layer cross-tenant isolation was proven against two real
  synthetic tenants in Postgres, including negative controls (this release's own suite). The
  live application-route proof against `app.abarva.ai` covered same-tenant success, cross-event
  denial, UUID-guessing indistinguishability, and zero partial writes — using two real events
  under the one tenant session available (same-tenant ingest/accept succeeds; a real fact
  accessed via the wrong event's URL returns an identical `404 fact_not_found` as a fabricated
  nonexistent UUID; denied attempts leave no partial writes; a sibling event's read is empty of
  the other event's facts). A second signed-in tenant session was unavailable (the app's
  sign-out control does not work — tracked separately — and the agent is not permitted to
  authenticate a second account itself), so **the live app-route cross-tenant check remains an
  explicitly documented limitation** — see ADR-0014's closure amendment for the full evidence
  chain and citations.

## Rollout Plan

Merge to `main` via PR. No runtime rollout — this release adds only test/CI infrastructure
(a new SQL regression suite, a TS runner, a CI workflow step, and test-file additions). Takes
effect the next time `.github/workflows/azure-l5-reset-replay.yml` runs (every PR touching a
migration or this suite's own files, plus the weekly Sunday schedule).

## Deployment Authority

- Repo-owned deploy workflow: N/A — no application code or runtime image changes.
- Shared runtime mutators: none.
- Approved image digest: N/A.
- ACA runtime invariant: N/A.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: no for this release itself (offline/CI test infrastructure);
  the workstream's separate live multi-tenant proof is partial with a documented limitation —
  see ADR-0014's closure amendment.

## Rollback Plan

Revert the merge commit. Removes the new CI step and test files; no schema, data, or runtime
behavior is affected either way — this release cannot regress a live system, only CI coverage.

## Audit Evidence

- PR: [#5631](https://github.com/abarva-platform/abarva/pull/5631) (merge commit
  `1b4bfbc9d7c76f4c0f79c5763762532bce4e8ea1`).
- CI run of the new "Fresh Postgres migration replay" step:
  [30182625608](https://github.com/abarva-platform/abarva/actions/runs/30182625608) — passed.
- Local validation evidence (this pass): 11/11 scenarios green against a live ephemeral
  Postgres; negative control confirmed 5/11 scenarios correctly flip to `fail` when the PR B
  triggers are disabled, restoring to 11/11 green after re-applying the real migration.
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md`.
- Design decision: `docs/architecture/adr/ADR-0014-vendor-proposal-facts-rls-tenant-context.md`
  (PR C amendment).
- Prior releases this closes out: `2026-07-25-vendor-proposal-facts-rls-foundation.md` (PR A),
  `2026-07-25-vendor-proposal-facts-cross-table-isolation.md` (PR B).

## Known Gaps

- **The dedicated `rls-regression.yml` workflow's `lab-control`/`lab-context` targets have no
  configured `AZURE_CONTROL_DATABASE_URL`/`AZURE_CONTEXT_DATABASE_URL` secrets** — a
  pre-existing, already-tracked infra gap (flagged separately during PR A). This release routes
  around it by using `azure-l5-reset-replay.yml`'s ephemeral Postgres instead, which needs no
  such secret, but the dedicated workflow's gap itself remains open.
- **This release does not re-prove plain list-isolation for these two tables** (already proven
  by `rls-regression.sql`'s auto-discovery) or authoritative-downstream-context purity /
  governed-read-contract exclusions (already proven by PR3's and PR B's own tests,
  `vendor-proposal-facts.test.ts` and `context-binder.test.ts`) — named explicitly rather than
  duplicated.
- **The live app-route cross-tenant check is an explicitly documented limitation, not a closed
  item** — see ADR-0014's closure amendment. Database-layer cross-tenant isolation was proven
  against two real synthetic tenants in Postgres, including negative controls. The live
  application-route proof covered same-tenant success, cross-event denial, UUID-guessing
  indistinguishability, and zero partial writes, using two real events under the one tenant
  session available — it did not, and could not, cover a live cross-tenant application-route
  check, because a second signed-in tenant session was unavailable (the app's sign-out control
  is broken, tracked separately). Per explicit user decision, this composition of evidence is
  accepted as sufficient to close the workstream, with the gap named rather than closed over.
