# 2026-10-02 — The Recorded Design Decision Is Restored After a Reload

## Release ID

`2026-10-02-design-decision-restored-after-reload`

## Status

`candidate`

## Plain-English Summary

In the design phase a person selects one of the offered options, and the choice is recorded when the build is approved. The selection itself lived only in the open page. After a reload the page showed no option selected, disabled the build, and asked for the decision again — although the decision was already recorded.

The page now reads the recorded decision and shows that option as selected, when it is still one of the options on offer. If no decision is recorded, nothing is selected, as before. A recommendation is still never treated as a selection.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves design-phase behavior for every client; not behind a feature flag.

- **Product layer — Moves design decision:** Initial selection state on the design phase page. How a decision is recorded and approved is unchanged; a build still records the decision again when it is approved.
- **Canonical model:** No schema or data changes. One additional read of an existing record.

## Client Applicability

- All clients using Moves receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/phase-templates/uploaded-solution-options.ts`: `restoreApprovedOptionId` — match the recorded choice to an offered option by name; the recorded id only breaks a tie between options with the same name.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`: read the recorded decision on the design phase.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: use it as the selection when the person has not clicked one.
- Tests for the matching rule and for the page.

## QA / Validation

- Targeted Jest: pass — option helper suite and phase page component suite, 6 new tests.
- Mutation check: with the recorded option not used for selection, the page test fails.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow with a recorded design decision, reloading the design phase cleared the selection and disabled the build until the option was clicked again.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, reload the design phase of the synthetic workflow and confirm the recorded option is shown as selected.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation result: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- When no option is selected, the disabled build button still reads as if inputs were incomplete; the specific reason is shown elsewhere on the page.
- The page does not say that the shown selection comes from a recorded decision, or when it was recorded.
