# Moves governed data foundation synthetic E2E pack

## Release ID

`2026-10-05-moves-gdf-synthetic-e2e-pack`

## Status

`candidate`

## Plain-English Summary

Adds a separate, fictional evidence pack for testing the governed data foundation Move journey. The package supplies one synthetic source file for each required P2 evidence family, two scripted session records, and a simulated P3 reviewer redline that must wait until a real generated draft exists. Files are uploaded through the signed-in product workflow and remain pending review; the package contains no loader or approval shortcut.

## Layer Impact

- **Release lane:** `experimental` (offline synthetic QA asset; no runtime activation).
- **Client intake / canonical evidence:** adds only offline test inputs and a Move-registry-scoped dataset declaration. Any eventual upload is bound to the authenticated Move by the product; the files themselves do not declare a tenant.
- **Products / Moves:** no runtime behavior changes. The pack exists to exercise the existing upload, review, artifact, and phase workflows.
- **Governance / QA:** adds a manifest contract check so the intended 11-family coverage, pending review state, deferred redline, and no-agent-ready boundary remain testable.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: synthetic test materials.
- Public/demo only: no automatic public exposure; any manual product upload is restricted to the authenticated demo Move.
- Feature flag: none.

## Changes Included

- Synthetic fixture under `tests/fixtures/moves-governed-data-foundation-e2e/`.
- Dataset declaration under `docs/governance/dataset-manifests/`; no `load_approval` or `serving_approval`.
- QA validator, mutation tests, and CI step.

## QA / Validation

- PASS: `npm run test:moves:gdf-e2e-pack` (4 tests and package validator).
- PASS: `npm run validate:context-corpus:manifests` (warnings for existing non-person declaration labels; no errors).
- PASS: `npx eslint scripts/qa/validate-moves-gdf-e2e-pack.mjs scripts/qa/__tests__/moves-gdf-e2e-pack.test.mjs`.
- PASS: `npm run audit:test-ci-coverage:check` after regenerating the census.
- BLOCKED on first run, then corrected: `npm run release:check --base origin/main --head HEAD` required an explicit release lane and validation status; rerun result recorded after correction.
- No tenant data has been written by the fixture tooling. Signed-in product upload and evidence review are tracked separately from this code release.

## Rollout Plan

Merge through a PR only. No runtime deployment is required for the offline fixture or its validator. Uploads, if performed, use the product's authenticated evidence workflow and require human review before evidence contributes to family coverage.

## Deployment Authority

- Repo-owned deploy workflow: not applicable; no runtime code or flag changes.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for any subsequent end-to-end workflow claim; not asserted by this fixture PR.

## Rollback Plan

Revert the fixture, manifest, validator, test, CI step, and release record in a follow-up PR. No schema migration or runtime rollback is required.

## Audit Evidence

PR and CI checks for this release, the manifest-validation output, and later signed-in workflow evidence captured separately.

## Known Gaps

The synthetic inputs do not prove source-system access, actual HR definitions, privacy approval, architecture approval, Finance baselines, or client acceptance. The P3 redline is intentionally not upload-ready until a P3 artifact exists. No evidence is indexed, retrievable, or agent-ready as a result of this package.
