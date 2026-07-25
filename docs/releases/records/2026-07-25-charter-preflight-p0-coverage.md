# 2026-07-25-charter-preflight-p0-coverage — Charter preflight: is P0 capture enough to ground each section?

## Release ID

`2026-07-25-charter-preflight-p0-coverage`

## Status

`candidate`

## Plain-English Summary

New, read-only Charter preflight: given the Charter's 7 required sections (shared contract,
`2026-07-25-charter-shared-contract-consolidation`), reports per section whether P0's structured
capture actually grounds it — "complete" (fully backed), "partial" (some but not all of the
supporting P0 fields have content), or "missing" (nothing in P0 capture supports it at all). This is
the first real piece of the requested `CharterPreflightResult` model: acceptance criterion #5
("The generator performs a preflight validation before calling Claude and reports any missing
required inputs instead of fabricating them.").

`computeCharterPreflight()` (`src/lib/programs/charter-preflight.ts`) is a pure function mapping
each Charter section to the P0 capture keys (`phase-capture-contract.ts`'s `P0_CAPTURE_SECTIONS`)
that can responsibly ground it — e.g. `sponsor_commitment` needs `stakeholder_owner_view`;
`scope` needs `affected_function_process` (in-scope) and `scope_out`. A new read-only endpoint,
`GET /api/programs/workspace/[moveId]/charter-preflight`, loads a Move's real P0 capture and returns
the computed result — same thin-wrapper-over-a-deterministic-evaluator pattern as the existing
`evidence-readiness` route.

**This is advisory, not a hard generation block.** The spec calls for blocking final approval when a
core section can't be responsibly populated — deliberately not done in this increment. Blocking
without a UI surface to show the operator *what's* missing would just produce a confusing failure
partway through a live Move run (and this session is about to run one). Wiring this into the actual
generation-blocking gate (`assert-phase-ready.ts`'s `assertPhaseReadyForGeneration`) is explicit
follow-up work once that UI exists — recorded as a known gap, not silently dropped.

## Layer Impact

- **global-control-lane**: shared preflight logic + a new read-only API route, applies to every
  tenant's Moves.

## Client Applicability

- All clients: yes — the endpoint is new and additive; nothing existing changes behavior. No
  tenant-specific gating.

## Changes Included

- `src/lib/programs/charter-preflight.ts` (new) — `computeCharterPreflight()` (pure),
  `loadP0CaptureValues()` (reads `program_modules` phase-0 rows, same pattern as
  `moves-generate-deps.ts`'s `loadPhaseCapture`), `computeCharterPreflightForMove()` (convenience
  wrapper).
- `src/lib/programs/__tests__/charter-preflight.test.ts` (new) — complete/partial/missing coverage
  cases, exact section-key coverage.
- `src/app/api/programs/workspace/[moveId]/charter-preflight/route.ts` (new) — `GET` endpoint.

## QA / Validation

- `npx eslint` on all new files — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest` on `charter-preflight.test.ts` — 4/4 pass.
- Live signed-in proof — not yet run.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration — purely additive read-only endpoint + pure logic module.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — call the new endpoint against a real Move with real P0
  capture and confirm the per-section coverage matches what was actually captured.

## Rollback Plan

Revert the merge commit. No schema/data changes — reads existing `program_modules` rows only.

## Audit Evidence

- PR: to be opened.
- Related: `docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md` (PR #5583),
  `2026-07-25-charter-shared-contract-consolidation` (PR #5586), which this depends on.

## Known Gaps

- **Not yet a hard generation block.** Wiring this into `assertPhaseReadyForGeneration` so a Charter
  cannot be generated (or approved) when a core section is genuinely unsupported is the natural next
  step, but needs a UI surface to show the operator what's missing first — building a blocking gate
  with no way to see why it's blocking would be worse than not blocking at all.
- Only checks P0 structured capture. The full spec's `CharterPreflightResult` also wants enterprise
  context, approved evidence, and sponsor input as separate source-coverage dimensions — those
  aren't yet exposed through a single typed interface the way P0 capture is, so today's
  `sourceCoverageBySection` only reflects P0 capture coverage, not the full multi-source picture.
- No UI surfaces this endpoint yet — it exists but nothing in the Moves workspace calls it.
