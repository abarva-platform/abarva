# 2026-06-23-moves-architecture-required-tables — Moves Architecture Required Tables Completion

## Release ID

`2026-06-23-moves-architecture-required-tables`

## Status

`candidate`

## Plain-English Summary

The live Meridian Slice 7 run proved that the target architecture generator could draw the required architecture diagrams but still omit the required decision/tradeoff and KPI traceability tables. This release makes the table requirement explicit in the prompt and adds a deterministic completion pass that appends those missing tables from the already-assembled Solution Context when the model omits them.

## Layer Impact

`global-control-lane`: shared Moves deliverable generation and golden-bar behavior for all clients.

## Client Applicability

- All clients: applies to target-state architecture deliverables generated through Moves.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/visual-artifact-contract.ts`
- `src/lib/deliverables/generate-artifact.ts`
- `src/lib/deliverables/__tests__/generate-artifact.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/deliverables/__tests__/generate-artifact.test.ts src/lib/deliverables/__tests__/golden-bar.test.ts --runInBand`
- PASS: touched-file `npx eslint`
- PASS: TypeScript `tsc --noEmit`
- PASS: `npm run audit:control-plane-purity:check`
- PENDING: `npm run release:check -- --base origin/main --head HEAD`
- PENDING: ACA deploy and live Meridian P3 architecture retry

## Rollout Plan

Merge to `main`, deploy through the repo-owned `aca-main-deploy` workflow, then live-verify on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps deployment only
- Approved image digest: PENDING deploy
- ACA runtime invariant: `app.abarva.ai` must serve the new ACA revision at 100% traffic
- Worker image invariant: no worker image change
- Feature/env flag update path: none
- Live signed-in proof required: agent-meridian P3 target architecture regeneration passes golden bar

## Rollback Plan

Revert this release commit and redeploy the previous ACA digest through the same ACA workflow. No schema migration is introduced.

## Audit Evidence

PR, CI, deploy run, active ACA revision/digest, and live Meridian artifact IDs will be added after release.

## Known Gaps

This release does not change Claude/model behavior for every possible omitted exhibit. It handles the specific live failure mode where a target architecture artifact already has real architecture diagrams and no data-gap markers, but is missing the required decision/tradeoff and KPI traceability table exhibits. If the artifact is prose-only, contains `[DATA GAP]`, or is missing required diagrams, the golden bar still blocks it.
