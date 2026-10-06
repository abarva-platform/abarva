# 2026-09-30 — Moves Contact-Center Evidence Routing

## Release ID

`2026-09-30-moves-contact-center-evidence-routing`

## Status

`candidate`

## Plain-English Summary

Contact-center evidence files now map to their declared readiness families by explicit filename aliases. Files that do not match a family remain unmapped instead of being assigned to the first open hard requirement. CSV workflow maps are accepted for the process-map family and use the existing governed extraction and review path.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Products:** Updates the Moves P2 upload experience and the contact-center evidence contract. Uploads still require the existing review and approval controls before they can satisfy readiness.
- **Canonical model:** No schema or canonical-object changes.
- **Source adapters:** No changes.
- **Client intake:** No changes.

## Client Applicability

- All clients: Contact-center Moves using the affected P2 upload workflow.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Explicit contact-center filename-to-family aliases in the P2 readiness uploader.
- Removal of the fallback that assigned unmatched files to the first missing family.
- CSV acceptance for structured member-service workflow maps.
- Regression coverage for the synthetic package filenames and an unrelated unmapped file.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts --runInBand --silent` — **Pass**, 119 tests.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/archetypes/registry.ts src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts` — **Pass**.
- `npm run typecheck` — **Pass**.
- Mutation check: restoring the first-open-hard-family fallback made the unmapped-file regression test fail — **Pass**.
- GitHub CI, deployment, and signed-in upload/review proof — **Not run; pending merge and deploy**.

## Rollout Plan

Merge through a reviewed PR. The repository-owned ACA main deploy workflow builds and deploys the merged main SHA. No database migration or feature-flag change is required. Complete a signed-in P2 upload smoke after deployment before calling the change live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Main-branch workflow only; no ad hoc ACA updates.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Pending deployment verification.
- Worker image invariant: Pending deployment verification.
- Feature/env flag update path: None; no flag change.
- Live signed-in proof required: Yes; verify family routing, pending review, extraction, and unmapped-file behavior in a synthetic Move.

## Rollback Plan

Revert the merged change through a reviewed PR and let the repository-owned ACA main deploy workflow restore the prior behavior. No data migration rollback is required. Any already uploaded evidence remains subject to the existing review decision and is not reclassified by rollback.

## Audit Evidence

- Pull request and CI checks: Pending.
- ACA deploy run and runtime-invariant proof for the exact merged SHA: Pending.
- Signed-in synthetic P2 upload proof: Pending.

## Known Gaps

The end-to-end synthetic Moves journey is not complete. This candidate does not claim that uploaded evidence has been approved, that P2 is ready, or that later-phase gates have passed.
