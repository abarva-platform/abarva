# 2026-07-10-moves-phase-standalone-contract — Moves phase standalone contract

## Release ID

`2026-07-10-moves-phase-standalone-contract`

## Status

`candidate`

## Plain-English Summary

Moves phase pages now use the standalone phase workspace contract from the latest design artifact instead of pivoting into the older phase workbench. The page keeps the black product chrome, persistent phase rail, centered phase workspace, Files & Evidence explorer, compact aVa launcher, and gate ceremony in one product surface.

Gate approval now starts the required phase output flow from the same approval action: the page finalizes phase capture, queues the governed deliverables for that phase, and then submits the gate approval. The UI says the outputs are queued in the worker unless completed generation is actually observed.

## Layer Impact

- `global-control-lane`: changes the shared Moves phase page for every tenant by routing it through the standalone workspace component.
- `global-control-lane`: adds client-side orchestration for phase capture finalization, phase deliverable enqueue, and gate approval from one gate action.
- No `client-data-lane` impact: no schema, migration, tenant data load, read-model rebuild, or Move archival.

## Client Applicability

- All clients: yes, for Moves phase pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added in this release.

## Changes Included

- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`: renders the standalone Moves phase workspace directly instead of the legacy phase workbench route stack.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: adds the standalone Source-like phase workspace, Files & Evidence explorer, aVa launcher, and gate approval orchestration.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: covers the standalone shell, explorer, aVa launcher, and gate action that queues required phase deliverables before approval.

## QA / Validation

- Pass: `npx eslint 'src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx' src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — 1 suite / 2 tests passed. Jest printed pre-existing duplicate manual mock warnings, but no failures.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- Live signed-in proof: pending merge/deploy. Required proof is a real tenant Moves phase page, Files & Evidence explorer, aVa launcher, and gate approval behavior against the deployed runtime.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the image, verify the ACA runtime invariant, then run signed-in browser proof on `https://app.abarva.ai` for a Moves phase page and the Files & Evidence / gate approval paths.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be confirmed post-deploy.
- ACA runtime invariant: to be verified post-deploy.
- Worker image invariant: unaffected by this PR; deliverable generation still runs through the existing worker path.
- Feature/env flag update path: no env or flag update required.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release and redeploy. Because this release does not change schema or migrate data, rollback restores the prior Moves phase workbench routing and prior gate-generation UX after the ACA deployment rolls back.

## Audit Evidence

- User-supplied design artifact: `/Users/anand/Downloads/Moves Phase Workspace · standalone (3).html`.
- Pre-release screenshots showed the old phase workbench and newer explorer shell coexisting, creating a messy pivot between pages. This release makes the phase route use one standalone workspace surface.
- Focused local validation commands listed above.

## Known Gaps

- Live signed-in browser proof is pending deployment.
- The deliverable worker returns queued run IDs; this release starts those required outputs automatically but does not claim completed document generation until worker completion is observed.
