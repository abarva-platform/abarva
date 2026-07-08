# 2026-07-08-source-ava-cross-event-leak-guard — Source aVa cross-Source-event leak guard (3rd fix attempt)

## Release ID

`2026-07-08-source-ava-cross-event-leak-guard`

## Status

`candidate`

## Plain-English Summary

This is the THIRD attempt at the same live symptom. #4602 and #4605 each fixed a
REAL, verified bug — but neither fix stopped the live failure, confirmed by
repeated fresh-tab, no-history re-testing after each was merged and deployed.
Asking Source aVa "What evidence is missing?" inside the Lakeshore AMS Source
event (id `adcb1cd0-c586-4622-bd29-574cc5a10862`, code
`LAKE-AMS-2026-46EADB28`) kept answering with content naming a DIFFERENT, real
Lakeshore Source event — "Kyriba Treasury Rollout Commercial Readiness" (code
`LSH-KYRIBA-TREASURY-2026`).

#4602 and #4605 both fixed **cross-module** leaks (generic tenant-wide
context bleeding into a Source-event answer). This is a genuinely different
bug category: a **cross-Source-event** leak — one real Source event's data
bleeding into a DIFFERENT real Source event's answer, for the same tenant and
the same module. That is why both prior fixes, though correctly implemented
for what they targeted, left the symptom unchanged: they never touched the
actual leak path.

Root cause, established with REAL jest execution (not static string-matching
alone): `tenantSystemBlock` in `src/app/api/chat/agent/route.ts` is built
from `buildTenantContextBlock()` in `src/lib/intelligence/persistence.ts`,
which reads `enterprise_context_chunks` filtered ONLY by `tenant_key` +
`source_segment_id` (`program_inventory`, `it_landscape`,
`cross_program_signals`, ...). That table has no per-row Source-event
scoping column or metadata convention at all, so a tenant's ingested content
from EVERY Source event lands in the same tenant-wide segment and gets
concatenated into one block, regardless of which event the user is viewing.
This path was never touched by `shouldSuppressGenericContextBundleForSourceMode`
— the suppression predicate #4602 and #4605 both used for their own (different)
leak paths.

The fix adds a real, unconditional, code-level per-item filter
(`filterChunksToActiveSourceEvent`) that drops any tenant-wide chunk naming a
different Source event's code before it is ever assembled into the prompt.
The route resolves the active event's code plus every other Source event
code for the tenant and threads it into `buildTenantContextBlock` before
`tenantSystemBlock` is built. A gated diagnostic log
(`[source-event-scope-guard]`, behind `ABARVA_SOURCE_SCOPE_GUARD_LOG=1`)
proves the guard ran, with included/dropped counts and the dropped event
codes.

The deterministic Source grounding path itself (`readEventFacts`,
`listSourceArtifactsForSourceEventId`, vendor/lever/BAFO/committed-value
readers) was independently confirmed to already be correctly scoped by
`source_event_id` at the SQL level — this bug was isolated entirely to the
one unscoped tenant-context path.

## Layer Impact

- `global-control-lane`: `/api/chat/agent` (all agents/surfaces) and
  `src/lib/intelligence/persistence.ts` (used by every caller of
  `buildTenantContextBlock`, not just Source). The new `sourceEventScope`
  parameter is optional and additive — every existing caller that omits it
  keeps byte-identical behavior; only Source-detail turns with an active
  `sourceEventId` pass the guard.

## Client Applicability

- All clients: yes — the guard activates for ANY tenant with more than one
  Source event whose ingested tenant-context chunks share a segment; it is
  not Lakeshore-specific.
- Specific clients: Lakeshore is the tenant where the live symptom was
  confirmed (has 2+ real Source events: AMS + Kyriba Treasury).
- Internal only: no.
- Public/demo only: no.
- Feature flag: none required — this is a correctness fix, not a gated
  feature. The audit-mode diagnostic log is gated behind
  `ABARVA_SOURCE_SCOPE_GUARD_LOG=1` (off by default; no behavior change when
  unset).

## Changes Included

- `src/lib/intelligence/persistence.ts` — adds `filterChunksToActiveSourceEvent`
  (exported, pure, unconditional per-item filter) and
  `SourceEventScopeGuard`/`CrossEventFilterResult` types; `buildTenantContextBlock`
  accepts an optional `sourceEventScope` parameter and applies the filter
  before assembling the block; emits the gated `[source-event-scope-guard]`
  diagnostic log.
- `src/app/api/chat/agent/route.ts` — resolves `sourceEventScopeGuard` (active
  event code + every other tenant event code, via `getSourcingEvent` +
  `listSourcingEvents`) before `tenantSystemBlock` is built, independent of
  the `source_analytics` grounding flag (this is a data-scoping bug, not an
  analytics feature); fails closed (guard `null`) on any resolution error so
  the chat turn is never broken; threads the guard into
  `buildTenantContextBlock`.
- `src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts` —
  updates one pre-existing literal-string assertion to match the new call
  signature (`buildTenantContextBlock(tenantInventoryKey, sourceEventScopeGuard)`);
  no behavior change to the test's intent.
- `src/lib/intelligence/__tests__/persistence-cross-event-leak.test.ts` (new)
  — real jest execution proving: (1) the bug reproduces at the
  `queryEnterpriseContextChunks`/`buildTenantContextBlock` level with a
  realistic two-Lakeshore-event fixture; (2) a RED test (no guard passed)
  that leaks all 4 of the exact live-reported terms ("Kyriba", "treasury
  rollout", "$18.9M", "220 active users"); (3) a GREEN test (guard passed)
  proving none of those 4 terms leak and the active event's own real content
  still surfaces; (4) `filterChunksToActiveSourceEvent`'s diagnostic payload
  shape.
- `src/app/api/chat/agent/__tests__/source-ava-cross-event-leak-gate.test.ts`
  (new) — wiring regression: the guard is resolved before `tenantSystemBlock`,
  independent of the `source_analytics` flag, fails closed on error, and the
  diagnostic log/filter are present with the required shape; asserts no
  `[DEBUG-LEAK-TRACE]`-style temporary markers remain.

## QA / Validation

- **Runtime evidence (not static hypothesis):** actual jest execution against
  a mocked-but-representative Supabase fluent-client fixture reproduced the
  exact live symptom — see the RED test
  (`cross-event leak — exact live reproduction terms (Event A vs Event B) ›
  RED — before the fix (no guard passed), the AMS-scoped block leaks all 4
  Kyriba-only terms`), which passed against the UNFIXED call shape,
  confirming the leak is real. The GREEN test with the guard applied then
  passed with the same fixture, proving the fix closes it. Both were
  captured via real `--json` jest output, not description.
- **Diagnostic log — actual captured output** (temporary local invocation,
  removed after capture; the permanent gated log ships in `persistence.ts`):
  ```
  [source-event-scope-guard] {
    sourceEventId: 'LAKE-AMS-2026-46EADB28',
    contextItemsIncluded: 1,
    contextItemsDroppedCrossEvent: 2,
    droppedEventCodes: [ 'LSH-KYRIBA-TREASURY-2026' ]
  }
  ```
- `npx tsc --noEmit -p .` — 0 errors (matches origin/main baseline of 0; no
  net-new errors).
- `npx eslint <changed files>` — 0 errors; 1 pre-existing, unrelated warning
  (`sanitizeAutonomousDecisionLanguage` unused import in `route.ts`, present
  on origin/main untouched by this diff).
- `npx jest src/lib/source/ava/__tests__ src/app/api/chat/agent/__tests__
  src/lib/intelligence/__tests__/persistence-cross-event-leak.test.ts` —
  243/246 passing. The 3 failures are confirmed PRE-EXISTING on
  `origin/main` (byte-identical test files, reproduced by stashing this
  diff and re-running): `steward-trust-spine-wiring.test.ts`'s single-quote
  import assertion, `agent-quality-answer-key.test.ts`'s admin-surface
  assertion, and `agent-route-context-bundle.test.ts`'s "P4-P6 lifecycle
  labels" assertion — none touch the code this fix changed.
- No debug logging left in shipped code — confirmed via
  `git diff origin/main -- route.ts persistence.ts | grep console.log`:
  only the one permanent, env-gated `[source-event-scope-guard]` log line
  remains; zero `[DEBUG-LEAK-TRACE]`-style markers anywhere in the diff.

## Rollout Plan

Merge to `main` via PR (squash merge). No migration required (the guard
operates entirely in-process on already-queried rows; no schema change).
No feature flag required — activates automatically for any Source-detail
turn with an active `sourceEventId`. Standard ACA main-deploy pipeline
picks up the change on the next `main` merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none — this PR does not touch ACA revisions,
  images, or traffic weights.
- Approved image digest: N/A until this PR merges and the standard pipeline
  builds/deploys it.
- ACA runtime invariant: to be verified after merge + deploy, per the
  standard runbook.
- Worker image invariant: not applicable (no worker changes).
- Feature/env flag update path: none required; `ABARVA_SOURCE_SCOPE_GUARD_LOG`
  is an optional, off-by-default diagnostic toggle, not a behavior flag.
- Live signed-in proof required: yes — before claiming "live-proven," a
  signed-in re-test of "What evidence is missing?" inside the Lakeshore AMS
  event must confirm the answer no longer references Kyriba/treasury
  rollout/$18.9M/220 active users. NOT YET PERFORMED as part of this PR (no
  live deploy access in this sandbox) — this is explicitly a gap, not a
  claim of live resolution.

## Rollback Plan

Revert this PR's merge commit. No migration to roll back. Behavior reverts
to the pre-fix, unscoped `tenantSystemBlock` construction (the confirmed-
still-broken symptom) — acceptable rollback risk since the guard is
additive and side-effect-free elsewhere.

## Audit Evidence

- This PR's diff (`src/lib/intelligence/persistence.ts`,
  `src/app/api/chat/agent/route.ts`).
- `src/lib/intelligence/__tests__/persistence-cross-event-leak.test.ts` —
  RED/GREEN proof, runnable at any time to reproduce the evidence in this
  record.
- `src/app/api/chat/agent/__tests__/source-ava-cross-event-leak-gate.test.ts`
  — wiring regression.
- Captured `[source-event-scope-guard]` log output (this document, QA section).

## Known Gaps

- **No live/staging deploy verification was performed for this specific PR**
  — this sandbox has no reachable Clerk/Azure/Postgres environment or
  running dev server against the live Lakeshore tenant. The evidence above
  is real jest runtime execution against a representative fixture, which is
  a materially stronger evidence bar than the static-only regression tests
  #4602 and #4605 shipped with — but it is not a live-deployed, signed-in
  browser re-test. That live re-test is required before this symptom can be
  declared resolved in production, exactly as the deployment-authority
  section states.
- The fix targets the ONE unscoped tenant-wide context path
  (`tenantSystemBlock` / `enterprise_context_chunks`). The two paths #4602
  and #4605 fixed were independently re-verified (by code inspection) to
  remain correctly suppressed; the deterministic Source grounding path
  (`readEventFacts`, artifact/vendor/lever readers) was independently
  confirmed already scoped by `source_event_id` at the SQL level. If a
  FOURTH leak path exists that this investigation did not surface, it is
  not covered by this fix.
- `enterprise_context_chunks` has no durable per-row Source-event-id column;
  the guard works by matching event CODES in chunk text, which is robust
  for the reported symptom but is a heuristic, not a schema-enforced
  invariant. A follow-on could add a real `source_event_id` column to that
  table's ingestion path for a stronger, non-text-matching guarantee.
