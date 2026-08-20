# 2026-08-19-moves-risk-tier-scoring — Risk-tier scoring engine + P2 Risk Assessment panel

## Release ID

`2026-08-19-moves-risk-tier-scoring`

## Status

`candidate`

## Plain-English Summary

Moves gains a real risk-scoring model on the P2 Discover & Diagnose phase. A
new "Risk Assessment" panel lets someone answer 13 structured questions about
a Move — five about its structural risk (what data it touches, how much human
oversight there is, whether it writes to systems, where it was built, how many
domains it spans) and eight about how it's actually used (PHI exposure,
autonomous action, clinical decisioning, and so on). Those answers combine
into a single risk score and tier (Low/Moderate/High/Critical), and the tool
flags plainly whether the Move needs Governance Council review. This is off by
default for every tenant and only reachable today for `meridian-health`.

## Layer Impact

Release lane: `client-data-lane` (tenant-scoped Moves capability, new feature
flag, no global schema or shared-behavior change).

- **Layer 4 (Products) — Moves.** A new top-level workspace view on the P2
  phase page, following the exact pattern already proven by
  `moves_pricing_engine`'s P4 "Cost & Effort" panel — additive, not a change
  to the shared per-phase render logic (`PhaseBody`'s if-ladder is untouched).
- **Layer 3 (Canonical Model) — additive only.** The 13 raw inputs are stored
  in the existing `engagements.charter` JSONB under a new namespaced key
  (`p2_risk_tier_inputs_v1`); the score itself is never stored — it's always
  recomputed on read from the stored inputs, so there's no stale-cache class
  of bug if the scoring model changes later. No migration, no new table.

## Client Applicability

- All clients: no change (flag defaults off).
- Specific clients: `meridian-health` (enrolled in `moves_risk_tier_scoring_v1`).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_risk_tier_scoring_v1` (tenant policy, default off).

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/6529
- Commit: `feat(moves): risk-tier scoring engine + P2 Risk Assessment panel`
- New files: `src/lib/programs/risk-tier-scoring.ts`,
  `src/lib/programs/p2-risk-tier-fields.ts`,
  `src/app/api/v1/programs/[programId]/risk-assessment/route.ts`,
  `src/components/strategic-moves/risk-assessment/` (panel + index).
- Modified: `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`,
  `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`,
  `src/lib/features/registry.ts`, plus new/updated tests.
- Builds on the prior two releases:
  `2026-08-19-moves-extended-p0-intake-fields` (PR #6526),
  `2026-08-19-moves-classify-fast-lane` (PR #6528).

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — 0 errors, full project.
- `npx eslint` on every touched file — 0 errors, 0 warnings.
- 90/90 tests passing in the directly-touched area:
  - 18 scoring-engine tests, including two GOLDEN FIXTURES reverse-engineered
    from and verified exactly against worked examples in the source model
    (dimension score, escalator score, total score, and band all match
    precisely), plus every band-threshold boundary and both override rules.
  - 8 charter-storage-module tests (embed/read/apply, malformed-data
    handling).
  - 5 `RiskAssessmentPanel` component tests. One of these caught a real logic
    bug during development — see below.
  - 59 `MovesPhaseStandaloneClient` tests: 56 existing unchanged (proving
    every other tenant's phase workspace is byte-identical) + 3 new tests
    mirroring the `moves_pricing_engine` rail-button gating pattern exactly
    (hidden when off, shown+opens only on P2 when on, hidden on any other
    phase even with the flag on).
- Broader regression sweep: `src/lib/programs/__tests__/`,
  `src/components/strategic-moves/`, `src/app/api/v1/programs/` —
  877/879 passing. All 3 failing suites confirmed pre-existing and unrelated
  (identical failures with this branch's changes stashed out): 2 are the
  same pre-existing failures noted in the prior two release records
  (`clientname-tenant-resolution.test.ts`, `current-state-doc-ingest.test.ts`);
  1 new one found this pass (`moves-liability-visible-controls.test.tsx`) is a
  pre-existing Clerk/Jest ESM transform config issue, unrelated to Moves or
  this change — also confirmed to fail identically with this branch's changes
  stashed out.
- **A real bug caught during development, not just an audit note**: right
  after loading a prior saved assessment, the panel showed "Live preview —
  not yet saved" instead of "Last saved," because the original logic treated
  "every field is filled" as equivalent to "the user has unsaved edits." Fixed
  by tracking the last-saved inputs explicitly and computing dirtiness against
  them, with a test covering the exact scenario.
- Live signed-in browser click-through was not captured — same pre-existing
  local infra gap recorded in the prior two release records (no local network
  route to the private Azure Postgres VNet). Recorded as a known gap, not
  silently skipped.

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys
the shared Product/Lab web image automatically on merge — no ad-hoc Azure
commands run by this change. The flag is off by default, so the deploy itself
carries no behavior change for any tenant beyond `meridian-health`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none — no `az` CLI commands, no Container App
  template changes, no environment variable changes in this PR.
- Approved image digest: n/a — standard deploy workflow builds and pins as
  usual.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected — no worker code touched.
- Feature/env flag update path: `src/lib/features/registry.ts` (in-repo, code
  reviewed via this PR) — Meridian enrolled via `includeTenants` directly in
  code, matching the precedent from the two prior releases.
- Live signed-in proof required: yes, deferred — see Known Gaps.

## Rollback Plan

Revert this PR (single squash commit) and merge to `main`; the next
`aca-main-deploy` run redeploys the prior image. No migration to reverse —
the risk-tier inputs are an additional key inside the charter JSONB, ignored
by all existing readers. No tenant needs to be un-enrolled since only
`meridian-health` was ever enrolled.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/6529
- Local typecheck/lint/test output captured in this session's transcript.
- `git log` on `feat/moves-p1-classify-fast-lane` for the exact commit.

## Known Gaps

- **Live signed-in browser proof is not yet captured**, for the same reason
  recorded in the two prior releases. Should be captured on the next pass
  against a reachable environment.
- **The severe-condition override is AbarVa's own operationalization of a
  qualitative source rule**, not a literal transcription — the source model
  names examples (autonomous clinical action, patient-direct GenAI) but gives
  no exact formula. Documented in code (`risk-tier-scoring.ts`) and here as a
  judgment call a future pass could revisit with more source guidance.
- **The escalator point scale skips the value 1** (NotTriggered=0,
  Moderate=2, High=3, Critical=4) — this asymmetry is preserved faithfully
  from the source model's own worked examples (verified against both golden
  fixtures), not smoothed into a nicer symmetric scale.
- **This is the "starts" of risk-tier scoring, per the audit's phase map, not
  the finish.** Per that plan, the score computed here should be _refined_
  during P3 Design Future State once Build Origin/Integration
  Impact/Human Oversight are actually decided by the solution design — that
  refinement is not part of this PR.
