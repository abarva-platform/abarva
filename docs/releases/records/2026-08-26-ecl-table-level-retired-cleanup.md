# 2026-08-26-ecl-table-level-retired-cleanup — ECL Table-Level Retired Cleanup

## Release ID

`2026-08-26-ecl-table-level-retired-cleanup`

## Status

`candidate`

## Plain-English Summary

Adds object-level cleanup targeting for retired legacy data-plane objects. This lets operators dry-run and, after explicit confirmation, drop named `schema.table` targets inside mixed schemas without requiring the whole schema to be safe.

## Layer Impact

`client-data-lane` operator tooling only. The change extends retired-layer cleanup proof and workflow controls. It does not change product runtime behavior, tenant data, ECL projections, serving views, or route cutover.

## Client Applicability

- All clients: No direct product behavior change.
- Specific clients: None.
- Internal only: ECL cleanup and data-plane retirement operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ops/purge-retired-data-layers.mjs` accepts object targets through `--objects` or `RETIRED_LAYER_PURGE_OBJECTS`.
- Static preflight now validates object-level retirement status and scans exact `schema.table` code references.
- Live dry-run/apply now inventories object targets and checks outside dependencies for those objects.
- `.github/workflows/ecl-retired-layer-cleanup.yml` exposes an `objects` input and requires `APPLY_OBJECTS` for object apply.

## QA / Validation

Current candidate validation:

- PASS — `node --check scripts/ops/purge-retired-data-layers.mjs`
- PASS — `node scripts/ops/purge-retired-data-layers.mjs --self-test`
- PASS — object static preflight for `knowledge.entity_source_identity`
- PASS — workflow object cleanup static assertion
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` through PR. The capability is available to manual cleanup workflow dispatches. Object apply still requires explicit `APPLY_OBJECTS` confirmation and must pass dependency, code-reference, and status gates.

## Deployment Authority

- Repo-owned deploy workflow: No web deploy required.
- Shared runtime mutators: The workflow uses the governed ACA private operator for live dry-run/apply.
- Approved image digest: Resolved from the deployed ACA template at workflow runtime.
- ACA runtime invariant: Preserved by the ACA operator wrapper.
- Worker image invariant: Not changed.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. Existing schema-level cleanup behavior remains the fallback.

## Audit Evidence

- PR URL after opening.
- Local self-test and static object-preflight output.
- Future workflow dry-run artifact for the first object tranche.

## Known Gaps

This PR adds the table-level cleanup mechanism. It does not itself retire additional live objects; each object tranche still needs a governed dry-run proof before the status artifact can move.
