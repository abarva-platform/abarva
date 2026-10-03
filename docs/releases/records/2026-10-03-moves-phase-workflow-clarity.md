# 2026-10-03 — Moves Phase Workflow Clarity

## Release ID

`2026-10-03-moves-phase-workflow-clarity`

## Status

`candidate`

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
- Regression coverage verifies substep navigation, panel visibility, and saved structured-capture completion.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand --silent` — 114 passed.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 0 errors; pre-existing unused-symbol warnings only.
- Node 24 `tsc --noEmit` with an 8 GB heap — passed.
- `npm run release:check -- --base origin/main --head HEAD` — all 11 gates passed.
- Live signed-in P3–P5 walkthrough — pending deployment.

## Rollout Plan

Merge by squash through a pull request. Production rollout is performed only by `.github/workflows/aca-main-deploy.yml`. No feature flag or data migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: Repo-owned main deploy workflow only.
- Approved image digest: Pending the exact main-deploy run.
- ACA runtime invariant: Pending verification that the app template and 100%-traffic revision use the approved digest.
- Worker image invariant: Pending verification against the same approved digest.
- Feature/env flag update path: None; no flag or environment change.
- Live signed-in proof required: Yes. Walk P3–P5 on an authorized Move through workflow steps, capture-driven Continue, and final-step preparation disclosure.

## Rollback Plan

Revert the presentation-only change in a follow-up pull request and deploy the resulting main revision through the repo-owned ACA workflow. No data or approval records require rollback.

## Audit Evidence

- Source diff and component regression suite in this release branch.
- Pull request, CI result, exact ACA workflow run, approved image digest, runtime invariant, and signed-in walkthrough evidence will be added after those checks complete.

## Known Gaps

Runtime deployment and signed-in P3–P5 walkthrough are not yet proven. No workflow, evidence, approval, or generated-artifact behavior was changed.
