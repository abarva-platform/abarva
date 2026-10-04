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
- P3/P4 next-phase readiness workbooks, sample files, and preview/upload controls remain hidden until Approve & Build.
- Regression coverage verifies substep navigation, panel visibility, and saved structured-capture completion.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand --silent` — 114 passed.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 0 errors; pre-existing unused-symbol warnings only.
- Node 24 `tsc --noEmit` with an 8 GB heap — passed.
- `npm run release:check -- --base origin/main --head HEAD` — all 11 gates passed on the initial implementation; rerun for this follow-up candidate.
- Initial implementation merged as PR #8937 and deployed by run `37160398179` at merge SHA `bf47142a7942c482a3b0a222e7a002b1da23eb9a`; the runtime invariant passed on digest `sha256:1a831ae7966a5e123ed80fec008ba5a94b5423c92ecebc73cfa13d4f32e03f88`.
- A later main deploy at SHA `1ba24079b114f1502ab01b42b47efae314d6003b` also passed the runtime invariant on digest `sha256:dc4923736cf91f7b1788c098a464569341ac6c9bede360fb3bf2b071d4abd3e2`; it contains PR #8937 but not this follow-up candidate.
- Signed-in review loaded P3, P4, and P5 on a completed archived synthetic fixture. The active demo portfolio has no eligible P3+ Move, so capture-driven Continue cannot yet be exercised without advancing governed state. A direct P3 request on an active P1 Move correctly returned to P1.

## Rollout Plan

Merge by squash through a pull request. Production rollout is performed only by `.github/workflows/aca-main-deploy.yml`. No feature flag or data migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: Repo-owned main deploy workflow only.
- Approved image digest for this follow-up candidate: Pending its exact main-deploy run.
- Prior deployed runtime invariant: Verified for the exact runs listed in QA / Validation; the latest readback at that time showed app template, ready 100%-traffic revision, and both delivery worker jobs on one digest.
- Feature/env flag update path: None; no flag or environment change.
- Live signed-in proof required: Full capture-driven P3–P5 Continue interaction remains pending an eligible active synthetic Move; no gate or evidence state was changed for this presentation release.

## Rollback Plan

Revert the presentation-only change in a follow-up pull request and deploy the resulting main revision through the repo-owned ACA workflow. No data or approval records require rollback.

## Audit Evidence

- Source diff and component regression suite in the release PRs.
- PR #8937, its exact ACA deploy run, digest proof, and subsequent main runtime readback are recorded above; the follow-up candidate still needs its own deploy proof.
- Signed-in route review confirmed P3–P5 page rendering and final-step disclosure on a completed archived synthetic fixture, but does not prove an in-progress Continue interaction.

## Known Gaps

The initial implementation is deployed. This follow-up fixes the remaining early visibility of P3/P4 next-phase readiness controls; its deployment is pending. The signed-in in-progress P3–P5 walkthrough is still blocked by the absence of an eligible active synthetic Move. No workflow, evidence, approval, or generated-artifact behavior was changed.
