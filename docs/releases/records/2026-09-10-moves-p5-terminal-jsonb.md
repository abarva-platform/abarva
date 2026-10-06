# 2026-09-10-moves-p5-terminal-jsonb — Moves Terminal Handoff JSONB Write Fix

## Release ID

`2026-09-10-moves-p5-terminal-jsonb`

## Status

`candidate`

## Plain-English Summary

The final Strategic Moves phase gate can now record its terminal handoff snapshot and audit state on the Azure Postgres runtime. The route already passed the governed gate checks; this change fixes how its P5-only terminal write serializes structured JSON fields before inserting them into JSONB columns and prevents a partial approved snapshot from being mistaken for a fully completed terminal handoff.

## Layer Impact

Layer 4 Products: Strategic Moves phase-gate approval behavior is corrected for the terminal P5 handoff path.

Layer 3 Canonical Enterprise Model: No schema change. Existing Move records are updated through the existing phase snapshot, engagement, and module state tables.

Lane: `global-control-lane` because the signed-in Strategic Moves route behavior is shared across clients.

## Client Applicability

All clients using Strategic Moves terminal handoff.

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`
- `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts`

## QA / Validation

- Pass: focused route regression verifies terminal P5 JSONB fields are serialized as parseable JSON and that a partial P5 approved snapshot is repaired rather than short-circuited.
- Blocked: targeted integration route coverage includes the terminal P5 handoff assertion, but the suite currently stops on unrelated P0 capture expectations on latest `main`.
- Pass: ESLint run for changed route and test files.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the image. After deployment, retry the signed-in terminal P5 gate approval for the active synthetic smoke Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved deploy workflow.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, terminal P5 gate approval on the active synthetic Move.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No migration rollback is required.

## Audit Evidence

Inspect the PR, CI output, deploy workflow, ACA runtime invariant output, and the signed-in synthetic smoke report.

## Known Gaps

The terminal P5 route still uses the route-local write helper rather than the broader programs write adapter because it deliberately completes the lifecycle without writing `current_phase = 6`. A future cleanup can move this terminal handoff into a typed adapter method, but this release keeps the behavioral surface unchanged and fixes only the JSONB serialization and partial-state repair defects.
