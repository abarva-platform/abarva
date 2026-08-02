# 2026-08-02-tower-schema-command-center-binding — Tower Schema Command Center Binding

## Release ID

`2026-08-02-tower-schema-command-center-binding`

## Status

`candidate`

## Plain-English Summary

Tower's command center now reads the governed `tower.*` read model instead of the retired `cio_tower.mart_*` tables. The UI preserves unknown financial value as unknown, so incomplete claims are not displayed as zero-dollar outcomes.

## Layer Impact

Release lane: `global-control-lane`.

Canonical model: consumes the populated Tower read model and preserves claim state, provenance, and attestation gates.

Products: updates the Tower projection only. No product becomes the source of truth.

## Client Applicability

All clients: Tower route behavior changes where the `tower.*` read model is populated.

Specific clients: none.

Internal only: local DDL is review material only until approved through the database lane.

Public/demo only: no.

Feature flag: no new flag.

## Changes Included

- `/tower` route binding to `src/lib/tower/readTowerCommandCenter.ts`.
- UI handling for unknown value across command, value proof, decision lanes, and evidence views.
- Focused Tower reader and command-center tests.
- Reviewable unknown-safe `tower.value_funnel` DDL under `db/tower/`.
- Tower audit, reconciliation, Claude contract, and QA reports under `reports/`.

## QA / Validation

- Focused ESLint passed.
- Focused Jest passed, 62 / 62 tests.
- TypeScript passed with `NODE_OPTIONS='--max-old-space-size=8192'`.
- Tower fact-lineage report was refreshed.
- Local DB smoke confirmed `generatedFrom: tower_schema` with 162 claims and 162 unknown-value claims.
- Local browser navigation confirmed Clerk redirects unsigned `/tower` access to sign-in.

## Rollout Plan

Merge through PR, build through the repo-owned ACA deploy workflow, and perform signed-in Tower browser proof after deployment. Apply the unknown-safe `tower.value_funnel` DDL only through the approved database change lane.

## Deployment Authority

- Repo-owned deploy workflow: required for shared web runtime.
- Shared runtime mutators: none in this branch.
- Approved image digest: to be produced by the deploy workflow.
- ACA runtime invariant: required before live claim.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the Tower route binding and UI unknown-value handling in application code. Do not drop or alter database objects outside the reviewed DB lane. If the DDL has been applied, restore the prior view definition only through the database rollback process.

## Audit Evidence

- `reports/TOWER_DATA_MODEL_AUDIT.md`
- `reports/TOWER_PAGE_BINDING_MAP.md`
- `reports/TOWER_RECONCILIATION_AND_DQ.md`
- `reports/TOWER_CLAUDE_CONTEXT_CONTRACT.md`
- `reports/TOWER_CLAUDE_VALIDATION.md`
- `reports/TOWER_IMPLEMENTATION_HANDOFF.md`
- `reports/TOWER_BUILD_QA.md`
- `reports/tower-fact-lineage/lineage.md`
- `reports/tower-local-route-20260802.png`

## Known Gaps

- Signed-in Tower browser proof was not captured locally.
- Old `cio_tower.mart_*` table archive/purge was not executed.
- Cube semantic layer was not implemented.
- Production/lab deployment was not performed.
