# 2026-07-18-moves-ux1-standard-shell-slice1 — Moves Phase Shell: Label Alignment + One Primary CTA

## Release ID

`2026-07-18-moves-ux1-standard-shell-slice1`

## Status

`candidate`

## Plain-English Summary

First slice of the `MOVES-UX-1` backlog item (standardize the P0-P5 phase shell). This release does two things across the Strategic Moves phase workspace: (1) aligns substep tab labels toward the target vocabulary "Review Inputs → Upload Evidence → Review Insights → Approve & Build" wherever a phase's real content genuinely matches that concept, without renaming steps that have distinct real content into a misleading label; (2) removes duplicate primary call-to-action buttons so each screen has exactly one primary action, not two or three competing ones.

Label changes: P1 "Charter inputs"→"Review Inputs", "Upload files"→"Upload Evidence". P2 "Prepare"→"Review Inputs", "Upload & review"→"Upload Evidence", "Review findings"→"Review Insights" (P2 now matches the target 4-step model exactly). P3/P4/P5's first substep "Prepare"→"Review Inputs"; their other substeps (Compare options, Design canvas, Value case, Plan workstreams, Execution readiness) were left as-is because they describe genuinely distinct content that a 4-word canonical label would misrepresent — collapsing those is deferred (see Known Gaps).

CTA de-duplication: P2's "Review Insights" tab had two primary-styled buttons doing the same thing ("Open Files & Evidence" + a local "Continue to Approve & Build" duplicating the step-navigation bar's own primary button) — removed the duplicate, kept the one that adds distinct value. P0's origination handoff card had three total buttons on screen (step-nav bar primary + a local "Review P0 gate →" primary + an "Open gate link" secondary going to the same destination) — removed both local buttons; the step-navigation bar's single primary CTA and the tab strip itself now handle all navigation for this card.

P0's structural difference (a completely separate rendering path via `P0OriginationHandoff`, and a bare-button gate instead of the `PhaseApproveAndBuild` batch-build component P1-P5 use) was intentionally **not** touched in this slice — see Known Gaps.

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx` is the shared Strategic Moves phase workspace for every tenant.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: substep label renames (P1, P2, P3, P4, P5); removed duplicate primary button in P2's Review Insights substep; removed both local buttons (and the now-dead `goToGateStep` function and `onShowGate` prop plumbing) from `P0OriginationHandoff`.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: updated two tests that asserted the old labels/removed buttons to assert the new, intentional behavior instead (single top-bar primary CTA, no duplicate buttons).

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 20/20, including full regression coverage for the P0 handoff card and P2 findings/insights tab
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Not run: live signed-in browser proof (no valid local Clerk session in this environment, established earlier this session).

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — open a real Move's P1-P5 phase tabs post-deploy and confirm labels read correctly and only one primary button shows per screen.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- This PR's diff.
- `MovesPhaseStandaloneClient.test.tsx` full pass.
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- **P0's structural difference is deferred, not fixed.** `PhaseBody` still special-cases `phase.phase === 0` to bypass the normal per-substep content entirely (`P0OriginationHandoff` renders identically regardless of which of the "Prepare"/"Frame" tabs is selected — tab switching is currently decorative for P0's first two tabs). P0's gate approval also still uses a bare button instead of the `PhaseApproveAndBuild` batch-build component every other phase uses. Unifying these touches real gate-approval backend mechanics for actively-running Moves and needs its own careful, separately-tested pass rather than being folded into a label/CTA cleanup PR.
- **P3, P4, and P5 were not collapsed into exactly 4 substeps.** P3 has 5 (Prepare/Compare options/Upload decision/Design canvas/Approve & Build), P4 and P5 have 4 without a distinct "Upload Evidence" step. Their content is real and distinct — a mechanical rename to fit 4 canonical labels would misrepresent what's actually happening on those screens. Properly consolidating them (e.g., folding "Compare options" + "Design canvas" into one richer "Review Insights" tab) is real information-architecture work, sequenced as a follow-up slice of `MOVES-UX-1`, not attempted here.
- The step-navigation bar's persistent primary button still shows a second `.mxw-primary`-styled button on the `approve` substep for P1-P5 (it becomes "Review governed build →", scrolling to the same `PhaseApproveAndBuild` component already on screen) — visually two primary-styled buttons remain on that one substep, though they're not fully redundant (one scrolls, one submits). Not addressed in this slice.
