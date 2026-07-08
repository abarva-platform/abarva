# 2026-07-07-source-stage-progression-gates — Source multi-stage gate progression

## Release ID

`2026-07-07-source-stage-progression-gates`

## Status

`candidate`

## Plain-English Summary

Before this change, only the very first Source stage gate (Strategy → Scope) was a
real approval. Every other stage gate on the redesigned Source analytics canvas
looked approvable but did nothing — the confirm boxes and the Approve button were
presentational, so the event never actually advanced past Scope, RFP, Pricing, and
the rest.

This change makes EVERY Source stage gate a real approval. When an approver ticks
that stage's confirm boxes and clicks Approve on the stage the event currently sits
on, the event advances to the next stage in the canonical 11-stage order
(strategy → scope → rfp → responses → evaluation → pricing → bafo →
executive_decision → selection → transition → value). Approving on the final stage
(`value`) closes the event without advancing. A future stage the event has not yet
reached stays presentational — you cannot approve a stage the event is not on.

The approval semantics are unchanged: every approval still writes the append-only
`source_event_approvals` record and still requires all of that stage's
confirmations. Only WHICH next stage the approval advances to, and WHICH stage can
be approved, are generalized. The Strategy (P0) gate behaves exactly as before.

## Layer Impact

- `global-control-lane`: shared Source app behavior for all clients, gated behind
  the existing `source_analytics` feature flag. The stage-progression approval
  mechanism, the pure approval-decision function, and the approve API route are
  control-plane logic shared by every tenant that has the flag on. No client-scoped
  schema, seed, or data-plane change. No new runtime dependency.

## Client Applicability

- All clients: No.
- Specific clients: Only clients with the `source_analytics` feature flag enabled
  (today the Source analytics canvas is dark by default and enabled per-tenant).
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_analytics` (unchanged — this change adds no new flag and
  does not widen the flag's audience).

## Changes Included

- `src/lib/source/approval-decision.ts` — the pure decision now resolves the next
  stage via the canonical order (`nextSourceStage`) instead of the hardcoded
  `strategy ? 'scope' : null`; `advanceStageTo` widened from `'scope' | null` to
  `SourceStageKey | null`; approve validates against a caller-supplied
  `requiredConfirmationKeys` set (defaults to the P0 strategy set), enabling
  per-stage confirmation validation.
- `src/lib/source/constants.ts` — added the canonical `nextSourceStage()` helper
  co-located with the pre-existing `SOURCE_STAGE_ORDER` (reused, not duplicated).
- `src/lib/source/stage-gate-confirmations.ts` (new) — `confirmationKeysForStage()`
  and `WORKED_STAGE_CONFIRMATIONS`; the single source of truth for which
  attestations each stage's gate requires.
- `src/app/api/v1/source/events/[eventId]/approve/route.ts` — validates
  confirmations against the CURRENT stage's keys (not a hardcoded strategy set);
  advance + append-only approval-record write preserved.
- `src/lib/source/facts/view/stage-analytics-builder.ts` — the live stage gate's
  `nextStageName` now reflects the actual next stage (not the Scope exemplar's
  fixed "RFP").
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — attaches a LIVE approve
  action to the gate for the stage the event actually sits on (generalized beyond
  Strategy) via `resolveStageGateAction`; a not-yet-reached stage stays
  presentational.
- Tests: extended `src/lib/source/__tests__/approval-decision.test.ts` (strategy→
  scope, scope→rfp, pricing→bafo, transition→value, value→null, unknown→null, plus
  per-stage confirmation validation); added
  `src/lib/source/__tests__/stage-gate-confirmations.test.ts`.

## QA / Validation

- `tsc --noEmit` (full project, `--max-old-space-size=8192`): pass — 131
  pre-existing baseline errors (from the 6ebe6d4a9 canvas workstream), net-new = 0.
  Proof: grep of the 167-line error log for every changed file returns zero
  matches; the 131 errors are all in unrelated files (home/know, intelligence,
  agent dock, …).
- `eslint` on all changed files: pass (clean, exit 0).
- `jest` on `approval-decision.test.ts` + `stage-gate-confirmations.test.ts`:
  pass — 21/21 green. Broader `src/lib/source/__tests__` + `src/lib/source/facts`:
  669 passed; the 6 failing tests in 5 suites are PRE-EXISTING (confirmed
  identical failures on a clean origin/main checkout) and unrelated to this change.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Deterministic, no LLM. No value-lever math, insight, fact-ingest, or file-upload
  path was changed.

## Rollout Plan

Merge to `main` via squash merge (PR-only; do not push to `main` directly). The
change ships dark behind the existing `source_analytics` feature flag — no new
flag, no flag-audience widening. Live rollout happens through the repo-owned ACA
main deploy workflow on merge; no manual traffic shift, no migration, no worker
job. Live signed-in proof on an enrolled tenant (Lakeshore) is required before this
record is marked `released`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto-deploys
  on merge to `main`). No feature-branch or ad-hoc Azure command touches shared
  runtime.
- Shared runtime mutators: None in this change. No `az containerapp update`, no
  env/flag/secret/scale mutation.
- Approved image digest: Set by the main deploy workflow at merge time
  (digest-pinned `main-<sha>`); not overridden here.
- ACA runtime invariant: Unchanged — this PR does not mutate the web Container App
  template, traffic weights, or revision images.
- Worker image invariant: Unchanged — no worker job image touched.
- Feature/env flag update path: None — `source_analytics` audience is unchanged.
- Live signed-in proof required: Yes — an enrolled-tenant signed-in proof that an
  event advances through a non-Strategy gate must be captured before `released`.

## Rollback Plan

Pure code change with no migration and no data mutation. Roll back by reverting the
squash-merge commit on `main`; the ACA main deploy workflow redeploys the prior
digest-pinned image. Because the surface is flag-gated (`source_analytics`), a fast
mitigation is to disable the flag for the affected tenant, which returns the gates
to their prior presentational behavior without a redeploy.

## Audit Evidence

- PR URL: (added on PR open — `abarva-platform/abarva`, branch
  `feat/source-stage-progression-gates`).
- CI: release-check + typecheck/lint/jest as above.
- Local validation output: tsc log (net-new = 0), eslint exit 0, jest 21/21 green
  for the changed suites.

## Known Gaps

- The worked-stage gates currently reuse the canvas Scope-exemplar's three confirm
  boxes and `generates` list (evidence complete · exclusions/inputs reviewed ·
  stage final) because per-stage gate confirm sets and per-stage generated
  deliverables are not yet fact-derived in the analytics builder. The next-stage
  advance, the CTA label, and the confirmation-key validation are all correct
  per-stage; only the confirm-box copy and the "generated after approval" list are
  still the shared exemplar. Authoring per-stage gate confirms + generates is a
  follow-up.
- Non-strategy live stages render only when the event has enough committed facts to
  compute at least one value lever (`buildLiveStageView` returns null otherwise);
  a fact-thin stage falls back to the honest SAMPLE view, whose gate is
  presentational. Arming a live gate on a fact-thin worked stage is out of scope
  for this slice.
- Live signed-in proof on an enrolled tenant is still pending (see Deployment
  Authority) — this record is `candidate`, not `released`/`live-proven`.
