# 2026-10-07-moves-workspace-v2-outcome — Moves phase-workspace v2 OUTCOME findings (Increment 2)

## Release ID

`2026-10-07-moves-workspace-v2-outcome`

## Status

`candidate`

## Plain-English Summary

Increment 2 of the Moves phase-workspace redesign, behind the same feature flag
that is OFF for everyone by default. With the flag off, the product renders
exactly as it does today.

Increment 1 shipped the shell, where the OUTCOME step still showed the plain
hand-off recap. This increment makes the OUTCOME step a real **findings surface**
for the two intelligence phases — P2 Discover & Diagnose and P4 Roadmap &
Business Case:

- **"What we found this phase" as discrete, reviewable finding cards.** Each card
  carries a category eyebrow, the finding statement, a supporting detail, an
  evidence citation chip, a benchmark-source tag (Taxonomy trap / Industry
  baseline / Empirical / Client evidence / needs-a-baseline projection), a
  confidence level, and an Accept / Challenge review control.
- **An input-vs-generated split**, with the generated side read-only: the left
  panel lists the evidence the client provided; the right panel lists what the
  assistant produced from it (never user-filled) plus the deliverable that lands
  on attest.
- **A structural headline** that states the shape of the gap (e.g. structural —
  governance and definitions, not platform capacity) only when there is a
  structural gap to call.
- **An honesty note** whenever any finding rests on partial or in-review evidence,
  so lower-confidence findings read as gaps, not facts.

Every finding is **derived from real governed phase content** — the
archetype-driven current-state readiness report (one assessed evidence family per
instrument) and the latest generated deliverable's extracted content signals.
Nothing is invented: a count shown on a finding is a real committed-record count,
never a fabricated comparable; a family with no committed evidence is marked
lower confidence and held as a gap. When a phase has no governed content yet, the
surface shows a designed empty/pending state instead of guessing.

The GATE step reflects the review honestly: beside the governed approve control it
states the accepted / challenged / awaiting counts and names the specific open or
challenged finding that still blocks.

The capture-heavy phases (P0 / P1 / P3 / P5) keep the hand-off recap as their
OUTCOME, unchanged.

## Layer Impact

Lane: `global-control-lane`.

- **Products (Moves):** the phase-workspace presentation layer only. No product
  owns data here and none is introduced — the findings surface is a projection of
  the canonical current-state readiness report and the governed deliverable
  content signals, which this change reads but does not alter. No change to the
  canonical model, loaders, adapters, tenancy, or any gate/evidence logic; the
  governed generate+approve pipeline is untouched.

## Client Applicability

- All clients: no — flag is OFF by default, so behaviour is unchanged.
- Specific clients: none enrolled in this change.
- Internal only: no.
- Public/demo only: intended for signed-in review enrolment later, per the flag.
- Feature flag: `moves_workspace_v2` (`tenant` policy, `includeTenants: []`,
  default OFF). Conjoined server-side with `moves_capture_v2`. The OUTCOME
  findings surface and the GATE review summary render only when this flag is on
  AND the phase is an intelligence phase (P2 or P4).

## Changes Included

- `src/lib/programs/moves-phase-findings.ts` — new pure read model. Derives the
  findings list, the input-vs-generated split, the structural headline, and the
  confidence note from the real readiness report + content signals; exposes
  `isFindingsPhase`, `buildPhaseFindings`, and `summarizePhaseFindingsReview`
  (the gate summary).
- `src/components/strategic-moves/MovesPhaseFindings.tsx` — new presentational
  findings surface (cards, split, headline) and the `FindingsReviewGateSummary`
  gate-honesty line. Owns no persistence; the Accept/Challenge toggle is a
  presentation control the host holds and the gate reads.
- `src/lib/programs/moves-workspace-v2-spine.ts` — the OUTCOME stage becomes
  navigable, and is labelled "Findings", when a findings surface is present (a
  no-submit review). Defaults to Increment 1 behaviour when absent.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — new `outcomeFindings`
  slot; when present under `moves_workspace_v2` the OUTCOME step (view 3) renders
  the findings surface in place of the hand-off recap. The governed approve
  control still travels onto this screen. Legacy and recap paths unchanged
  otherwise.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — builds the
  findings model from `currentStateReadiness` + `carriesForwardContent`, holds
  the review state, passes the OUTCOME findings slot, and composes the GATE
  review summary into `gateExtras` for intelligence phases.
- Tests: `moves-phase-findings.test.ts` (new, read model + gate summarizer),
  `MovesPhaseFindings.test.tsx` (new, surface + gate line), plus OUTCOME-findings
  cases added to `moves-workspace-v2-spine.test.ts` and `MovesCaptureFlow.test.tsx`.
- `.github/workflows/ai-surface-control-catalog.yml` — names
  `MovesPhaseFindings.test.tsx` in the Moves visible-controls step. That
  directory is not swept by a glob, so a new suite beside those controls runs in
  no job until it is named there; without this line the new component suite was
  green and reporting to nobody, and the coverage census counted it as an
  untriaged unrun file.

## QA / Validation

- `npx jest src/components/strategic-moves src/lib/programs/__tests__/moves-phase-findings.test.ts src/lib/programs/__tests__/moves-workspace-v2-spine.test.ts` — 52 suites, 775 tests pass.
- `npx jest .../moves-phase-findings.test.ts` — 18 pass. `.../MovesPhaseFindings.test.tsx` — 13 pass.
- `tsc --noEmit` — clean.
- `npx eslint` on all changed files — 0 errors (2 pre-existing unused-import
  warnings, not introduced here).
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- Re-validated on the current `origin/main` after resolving the merge: the five
  affected suites (`MovesPhaseFindings.test.tsx`, `moves-phase-findings.test.ts`,
  `moves-workspace-v2-spine.test.ts`, `MovesCaptureFlow.test.tsx`,
  `MovesPhaseStandaloneClient.test.tsx`) — 5 suites, 318 tests PASS.
- `npm run audit:test-ci-coverage:write` after naming the new suite in CI —
  covered test files 2636 -> 2638 (both new suites counted), uncovered FLAT at
  164, fully-covered directories unchanged at 439.

## Rollout Plan

Merge to `main` via squash; squash auto-merge is armed, so the PR lands once its
required checks pass. No runtime rollout is triggered by this change: the flag is OFF for every
tenant, so merging changes no client's behaviour. Enrolment for signed-in review is
a later, separate flag flip through the normal feature-flag path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none — this PR mutates no shared runtime.
- Approved image digest: n/a (no image/runtime change in this PR).
- ACA runtime invariant: unaffected (no deploy in this PR).
- Worker image invariant: unaffected.
- Feature/env flag update path: `moves_workspace_v2` ships OFF; any later enrolment
  goes through `includeTenants` / the approved env override, not this PR.
- Live signed-in proof required: not for this PR (flag OFF, no behaviour change);
  required before any future enrolment flip is called live-proven.

## Rollback Plan

Revert the PR, or leave the flag OFF (its default), which already disables every
behaviour in this change. No migration, data build, or runtime image is involved,
so there is no state to roll back.

## Audit Evidence

- PR URL: see the pull request opened for branch `feat/moves-v2-outcome`.
- CI: the PR's checks on `main`.
- Test output: the jest / tsc / eslint / release:check results listed under
  QA / Validation.

## Known Gaps

- Charts (governed-share, Pareto, cost scenarios, value bridge, sensitivity) are
  deferred to Increment 3; this increment ships the finding cards, the split, and
  the structural headline only.
- The Accept/Challenge review is PRESENTATION-ONLY: there is no findings
  attestation store yet, so the toggle lives in host UI state and feeds the gate's
  honesty line only; it does not persist and is not read back across reloads. When
  a governed findings-review store exists it can own this state without the surface
  or the gate summary changing.
- The findings-review tally in the gate summary is advisory honesty copy; it does
  not itself gate the governed approve pipeline, which remains the existing
  readiness/evidence gate.
