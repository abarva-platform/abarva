# 2026-08-27-tower-ecl-serving-command-center - Tower Command Center Reads ECL Serving Views

## Release ID

`2026-08-27-tower-ecl-serving-command-center`

## Status

`candidate`

## Plain-English Summary

Tower's primary Command Center reader now uses the governed ECL serving views instead of the older Tower and consumption read models. The page fails closed when ECL serving rows are absent or when a returned row does not carry source-record references.

`readTowerCommandCenter` was contributing to the rendered Tower page before this release. This change repoints that live reader to ECL serving views; it does not remove a dead path.

## Layer Impact

- Layer 4 products: Tower's active Command Center route reads `serving.tower_*` views through the ECL serving contract.
- Layer 3 canonical/projection: No schema or data-plane changes are made by this release. The reader consumes already-built serving views.
- Release controls: The route fence now blocks pre-ECL Tower schema references in the live Tower route and API path.

## Client Applicability

- All clients: Yes, for the shared Tower runtime path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None introduced by this change.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts`: replaces pre-ECL table reads with ECL serving-view reads.
- `src/app/(maestro)/tower/page.tsx`: removes the old canonical reconciliation panel from the Tower first viewport.
- `scripts/ecl/__tests__/run-ecl-product-serving-route-fence-tests.mjs`: adds a Tower runtime scan that rejects pre-ECL Tower schema reads.
- `docs/architecture/ECL_TOWER_READ_PATH_DISPOSITION_2026_08_27.md`: records disposition for the verified Tower pre-ECL reference superset.
- Tower tests were updated to pin the ECL serving read path and source-reference fail-closed behavior.

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-ecl-product-serving-route-fence-tests.mjs`
- PASS: targeted Tower Jest suite, 5 suites and 19 tests.
- Note: the Jest run used the existing local dependency install from the main checkout because this clean worktree has no local `node_modules`.
- PASS: runtime files clear of pre-ECL Tower schema reads, 7 of 7.
- PASS: product runtime inventory dispositioned, 39 of 39.
- PASS: script/operator inventory dispositioned, 56 of 56.

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow may then build and deploy the digest-pinned web image. After deployment, run signed-in Tower route proof for `/tower` and the Tower ask/chat paths.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime activation.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be resolved by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower route and Tower answer paths.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data rollback is required because this release performs no data mutation.

## Audit Evidence

- Local route-fence output: 40 enumerated surfaces, 12 fenced projection tables, 0 direct projection violations, 0 pre-ECL Tower runtime violations.
- Local targeted Tower tests: 5 passed suites, 19 passed tests.
- Disposition artifact: `docs/architecture/ECL_TOWER_READ_PATH_DISPOSITION_2026_08_27.md`.

## Known Gaps

- This release resolves the Tower Command Center read path. It does not retire legacy tables by itself.
- The legacy migration-style cleanup aggregate is not an active status metric for this release. Tower reports runtime-clear and disposition metrics instead.
