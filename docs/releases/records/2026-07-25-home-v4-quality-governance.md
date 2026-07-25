# 2026-07-25-home-v4-quality-governance — Quality state, audited override, unambiguous job outcomes

## Release ID

`2026-07-25-home-v4-quality-governance`

## Status

`candidate` — schema, scripts, and UI ship together; the durable proof-bundle upload gracefully
no-ops until the shared object-store env vars are configured for this workload (see Known Gaps).

## Plain-English Summary

Today's real book-mode run surfaced two real gaps in how quality problems are seen and governed:
a `candidate_failed` row for first-capital required a brand-new inspector script just to read its
findings, and neither a generation failure nor a persistence failure for any tenant would have
left any queryable trace at all -- only a job log nobody re-reads. This PR closes both gaps.

1. **Schema** (`supabase/migrations/20260725160000_home_knowledge_v4_quality_governance.sql`):
   override audit columns on `home_knowledge_packs` (`override_reason`, `overridden_by`,
   `overridden_at`, `findings_acknowledged`), and a new `home_knowledge_v4_job_runs` table --
   one row per tenant per job execution, written regardless of outcome, so a generation or
   persistence failure is queryable even when no candidate row was ever created.
2. **Job hardening**: one tenant's generation failure no longer takes the whole batch down with
   it (`build-home-knowledge-v4-review-pack.mjs`'s `runPool` call had no per-item error isolation
   -- a single rejection propagated straight through `Promise.all`). Same for persistence: one
   tenant's DB write failing no longer stops the rest of the batch from persisting
   (`persist-home-knowledge-v4-book.mjs`). The npm chain (`canary-and-persist-job`) now runs
   persist unconditionally (`;` not `&&`), so tenants that generated cleanly still get persisted
   even if a sibling tenant's generation failed.
3. **Hard invariant**: a candidate can never be persisted without its `quality_report` -- asserted
   explicitly at the write site, not just trusted from `buildPackRow`'s default.
4. **Unambiguous outcomes**: every persist run now reports separate counts --
   `generated_clean` / `generated_with_quality_failure` / `generation_failed` /
   `persistence_failed` -- both to the console and as `home_knowledge_v4_job_runs` rows.
5. **Durable proof bundle**: each persisted candidate's full record (payload, prompt hash,
   model/version, candidate hash, quality report, validator version, job/run identifiers,
   generation/persistence timestamps) is written to Blob storage, reusing the same shared object
   store account/container `scripts/skyharbor/load-v2-substrate.mjs` already writes to -- no new
   infrastructure. Gracefully no-ops (never blocks persistence) when that env isn't configured.
6. **Audited override**: approving a candidate whose `validation_status` isn't `pass` now requires
   `--override-reason=<text>` (script) or a written reason in the review UI -- refused otherwise.
   The exact findings acknowledged at that moment are snapshotted into `findings_acknowledged`
   (not a live reference to `quality_report`, which could change under a later regeneration).
7. **Review UI**: `/home/v4-preview` (existing platform-admin-only route) now shows a review queue
   at the top -- each tenant's latest candidate/approved state, validation status, the real
   findings list (not hidden), and an Approve button that requires the override reason inline
   when validation failed. Recent generation/persistence failures are listed below it. Non-blocking
   warnings (e.g. meridian-health's evidence-quality warnings) remain visible on a `pass` candidate
   -- pass does not mean nothing to review.

The platform-admin auth check that gates this page was extracted into
`src/lib/auth/platform-admin-session.ts` so the new approve API route enforces the *exact* same
gate, not a hand-copied second implementation -- hand-copied auth checks drifting apart is what
caused this same page's earlier P0 cross-tenant exposure.

## Layer Impact

- `internal-admin` lane: schema, scripts, and UI are all internal review tooling. No
  client-data-lane change -- the review queue reads/writes the same `home_knowledge_packs` rows
  already governed by the standing "no V4 content loads until human review passes" rule; this PR
  makes that review possible and auditable, it does not change what gets approved automatically
  (nothing does).

## Client Applicability

- Internal only. No tenant is approved or made live by this PR. The review UI is platform-admin
  gated, same as before.

## Changes Included

- `supabase/migrations/20260725160000_home_knowledge_v4_quality_governance.sql` (new).
- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: per-tenant generation crash
  isolation; `generation-failed.json` marker; non-zero exit signal without throwing.
- `scripts/knowledge/persist-home-knowledge-v4-book.mjs`: `discoverGenerationFailures()`,
  `writeJobRun()`, `uploadProofBundle()`; per-tenant persistence crash isolation; hard
  quality-report assertion; `approveTenantPack()` override flow; outcome counts.
- `package.json`: `canary-and-persist-job` chain uses `;` instead of `&&`.
- `src/lib/auth/platform-admin-session.ts` (new) -- extracted shared admin gate.
- `src/lib/home/home-knowledge-v4-review.ts` (new) -- review-queue reads + audited approve/override
  write (TypeScript port of the same transactional logic, kept in sync by hand since the operator
  script and the Next.js app don't share code across environments).
- `src/app/api/admin/home-knowledge-v4/approve/route.ts` (new).
- `src/components/home/v4/HomeV4ReviewQueue.tsx` (new).
- `src/app/(maestro)/home/v4-preview/page.tsx`: uses the shared admin-session helper; renders the
  review queue.

## QA / Validation

- `pass` — `node --check` + `npx eslint` on all changed `.mjs`/`.ts`/`.tsx` files, exit 0.
- `pass` — Full production `npm run build`, zero errors; confirmed the new API route
  (`/api/admin/home-knowledge-v4/approve`) is registered in the build output.
- `pass` — `npm run home:knowledge-v4:test-manifest-validator` (16/16) and `test-prompt-preflight`
  (6/6) unaffected.
- `pass` — **Full end-to-end verification against a real local Postgres** (a pre-existing local
  dev container already running the base schema, not a mock): applied the migration directly
  (clean apply + confirmed idempotent re-apply), then ran the hardened persist script against a
  constructed 5-tenant candidate set covering all four outcomes at once (3 real candidates + 1
  simulated generation failure + 1 simulated persistence failure). Confirmed by direct query:
  - All 5 outcomes landed correctly in `home_knowledge_v4_job_runs` under one shared
    `job_execution_name`, including the persistence failure for one tenant not blocking the two
    tenants processed after it.
  - Approving a clean (`pass`) candidate without an override reason succeeded.
  - Approving a `fail` candidate without `--override-reason` was refused with the documented error
    message (exit 1).
  - The same approval with `--override-reason` succeeded and persisted `override_reason`,
    `overridden_by`, `overridden_at`, and a `findings_acknowledged` snapshot matching the exact
    violation that was overridden.
  - The **TypeScript** `home-knowledge-v4-review.ts` functions (a separate implementation from the
    operator script, written for the Next.js app) were independently exercised against the same
    database via `npx tsx`, confirming `listHomeKnowledgeV4CandidatesForReview` returns the latest
    row per tenant with the right violation counts, `listHomeKnowledgeV4RecentJobRunFailures`
    surfaces both simulated failures, and `approveHomeKnowledgeV4Candidate` approves correctly.
  - Caught and fixed one real bug during this verification: the review UI's approve handler
    originally bumped a client-side React `key` to "refresh" after approving, which would not
    actually re-run the server-side data fetch (`candidates`/`recentFailures` are server-fetched
    props) -- switched to `router.refresh()`.
- `not yet run` — live signed-in browser verification of the review UI itself (this environment
  cannot reach the production/private-VNet Postgres or complete Clerk auth locally, the same
  documented limitation as every other live-route change this session). Required post-deploy.

## Rollout Plan

1. Merge → `aca-main-deploy.yml` builds and deploys automatically. The migration applies via the
   normal migration-apply path; it is additive only (new columns with defaults, a new table) --
   no existing row's meaning changes.
2. Live signed-in verification: sign in as a platform admin, confirm `/home/v4-preview` renders
   the review queue with the 3 tenants' real current state (skyharbor-air and meridian-health
   already approved from live production use; first-capital pending review from its earlier
   regeneration).
3. Optional, separate action: configure `DATA_PLANE_OBJECT_STORE_ACCOUNT` /
   `DATA_PLANE_OBJECT_STORE_CONTAINER` for this workload's identity if durable proof-bundle upload
   is wanted immediately; otherwise it continues to no-op safely (see Known Gaps).

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: the migration adds columns/a table to `home_knowledge_packs`'s
  database, applied through the standing governed migration-apply path, not an ad-hoc `az`
  command.
- Live signed-in proof required: **yes** -- new UI surface on an existing admin route. Required
  before this record can move past `candidate`.

## Rollback Plan

Revert the PR. The new table and columns are additive and harmless to leave in place even if
reverted (no other code reads them once the reverting commit lands); a follow-up migration to
drop them is optional, not required for safety.

## Audit Evidence

- Local verification transcript (migration apply/re-apply, 5-outcome persist run, override-gate
  test, TypeScript lib independent verification) is recorded in the session transcript.
- `2026-07-25-home-v4-evidence-contract-fix.md` and `2026-07-25-home-v4-candidate-inspect-script.md`
  -- the real `candidate_failed` finding and inspection process that motivated this hardening.

## Known Gaps

- Durable proof-bundle upload requires `DATA_PLANE_OBJECT_STORE_ACCOUNT` /
  `DATA_PLANE_OBJECT_STORE_CONTAINER` to be set for the operator job's identity; until then it
  no-ops (logged, never blocks persistence) and the proof bundle exists only as the
  `home_knowledge_packs.render_pack`/`quality_report` columns already do, not as a separate
  durable artifact. Wiring the actual env/secret for this specific workload is a separate,
  smaller follow-up.
- Live signed-in browser proof of the review UI is the explicit open item before this record can
  be marked proven (see QA / Validation).
