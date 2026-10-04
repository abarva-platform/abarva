# 2026-10-03 — Moves Phase Workflow Clarity

## Release ID

`2026-10-03-moves-phase-workflow-clarity`

## Status

`deployed`

## Plain-English Summary

P3–P5 workflow steps now present one clear continue action at a time. Later-step content and next-phase preparation appear only when the user reaches the relevant step. Existing capture, evidence, approval, and artifact-generation rules are unchanged.

## Layer Impact

- **global-control-lane; Layer 4 — Products / Moves:** Presentation and interaction only. The shared phase canvas owns a consistent header action and progressive disclosure for P3–P5.
- **Layers 1–3:** No change to client intake, adapters, canonical objects, evidence, or governed records.

## Client Applicability

- All clients: Shared Moves interface behavior; no client data or policy changes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- P3–P5 workflow substeps use the shared canvas Continue action, with governed Approve & Build retained on the final step.
- P3 option comparison and decision confirmation are presented as distinct steps; supporting upload and optional decision-record actions are visually secondary.
- Preparation content is scoped to the active phase and later-step/next-phase panels are progressively disclosed.
- P3/P4 next-phase readiness workbooks, sample files, and preview/upload controls remain hidden until Approve & Build.
- Regression coverage verifies substep navigation, panel visibility, and saved structured-capture completion.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand --silent` — 114 passed.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 0 errors; pre-existing unused-symbol warnings only.
- Node 24 `tsc --noEmit` with an 8 GB heap — passed.
- Follow-up candidate PR #8940 — component suite 116/116, ESLint 0 errors, Node 24 `tsc --noEmit` passed, all PR checks passed, and local `npm run release:check -- --base origin/main --head HEAD` passed 11/11 gates.
- Initial implementation merged as PR #8937 and deployed by run `37160398179` at merge SHA `bf47142a7942c482a3b0a222e7a002b1da23eb9a`; the runtime invariant passed on digest `sha256:1a831ae7966a5e123ed80fec008ba5a94b5423c92ecebc73cfa13d4f32e03f88`.
- Follow-up PR #8940 merged as `be8bbcb2c6d6311905a3b1c846a9aa86fae99537`; exact ACA main-deploy run `37163851972` succeeded.
- The exact run deployed digest `sha256:62fa2be3f2572980bb31063a8362364068c40655982cec18cf7b0ba8f33df5c2` to revision `ca-abarva-web-lab-eastus--mbe8bbcb2`. Its proof bundle confirms the app template and 100%-traffic revision use that digest, both delivery worker jobs use that digest, health passed, and the runtime invariant passed. Independent Azure readback matched.
- Signed-in browser review on a completed archived synthetic fixture confirmed P3 Prepare/Compare Options and P4 Prepare/Value Case hide next-phase workbook/sample/upload controls, while their final Approve & Build steps reveal them. P5 Handoff Readiness hides Tower handoff preparation until final Approve & Build. No evidence, approval, phase, or artifact state was changed.
- The active demo portfolio has no eligible in-progress P3+ Move. Capture-driven Continue enabling/advance is therefore not live-proven; it remains covered by the component regression suite, not by this completed fixture.

## Rollout Plan

Merge by squash through a pull request. Production rollout is performed only by `.github/workflows/aca-main-deploy.yml`. No feature flag or data migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: Repo-owned main deploy workflow only.
- Approved image digest: `sha256:62fa2be3f2572980bb31063a8362364068c40655982cec18cf7b0ba8f33df5c2`.
- Active revision: `ca-abarva-web-lab-eastus--mbe8bbcb2` at 100% traffic; app template and both delivery worker jobs match the approved digest.
- Feature/env flag update path: None; no flag or environment change.
- Live signed-in proof: P3–P5 progressive disclosure verified on a completed archived synthetic fixture. Full capture-driven P3–P5 Continue interaction remains pending an eligible active synthetic Move; no gate or evidence state was changed for this presentation release.

## Rollback Plan

Revert the presentation-only change in a follow-up pull request and deploy the resulting main revision through the repo-owned ACA workflow. No data or approval records require rollback.

## Audit Evidence

- Source diff and component regression suite in the release PRs.
- PRs #8937 and #8940, exact ACA deploy runs, digest proof, and independent Azure runtime readback are recorded above.
- Signed-in route review confirmed P3–P5 progressive disclosure on a completed archived synthetic fixture, but does not prove an in-progress Continue interaction.
- A fresh signed-in tab and a hard-refreshed existing tab showed the deployed client behavior. The initial existing tab continued to show its previously loaded client bundle until hard-refreshed.

## Known Gaps

The signed-in in-progress P3–P5 walkthrough is still blocked by the absence of an eligible active synthetic Move. Capture-driven Continue is not claimed live-proven. No workflow, evidence, approval, or generated-artifact behavior was changed.
