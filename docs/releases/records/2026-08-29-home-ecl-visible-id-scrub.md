# 2026-08-29-home-ecl-visible-id-scrub — Home ECL visible identifier guard

## Release ID

`2026-08-29-home-ecl-visible-id-scrub`

## Status

`candidate`

## Plain-English Summary

Home's ECL narrative writer now prevents internal object identifiers from appearing in executive-visible chapter prose. The writer prefers resolved display labels when available and falls back to reader-safe descriptions when a raw identifier cannot be resolved.

## Layer Impact

- Lane: `global-control-lane`
- Products: Home preview narrative generation receives stricter visible-language controls for executive copy.
- Source adapters and canonical model: no schema or source-data changes.
- Projections: generated Home narrative rows may be rewritten to use display labels instead of internal identifiers before publication.

## Client Applicability

- All clients: Yes, for Home preview narrative generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home ECL provider/default behavior only; no new flag.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed.
- `jest --runTestsByPath src/components/home/preview/__tests__/ClaimCard.test.tsx src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts --runInBand` — passed.
- `git diff --check` — passed.
- `npm run release:check` — pending for this record.

## Rollout Plan

Merge through PR, let the repo-owned Azure Container Apps main deploy workflow publish the new digest-pinned image, then rerun the governed Home narrative apply/readback jobs for affected tenants.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: resolved by deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for affected Home preview route.

## Rollback Plan

Revert the PR and redeploy the previous approved ACA image. If narrative rows have already been regenerated, rerun the previous approved Home narrative apply job or restore the prior Home projection snapshot from the existing database backup/runbook path.

## Audit Evidence

- PR URL: pending.
- Local test output from the commands listed above.
- Post-merge ACA deploy evidence, Home narrative apply/readback proof, and signed-in browser screenshot are required before marking released.

## Known Gaps

This change does not redesign the Home visual experience. It only prevents internal identifiers from appearing in executive-visible generated narrative.
