# 2026-07-30-foundation-v2-healthcare-source-volume - Add Healthcare Source-Volume Loader

## Release ID

`2026-07-30-foundation-v2-healthcare-source-volume`

## Status

`candidate`

## Plain-English Summary

Foundation V2 Healthcare execution now has a dedicated source-volume loader that reads the frozen source package CSV files and derives expected counts from those files before any database write. This prevents the 21-row progressive fixture proof from being mistaken for the larger Healthcare source-corpus data load.

## Layer Impact

Layer 1 and Layer 2 data-plane tooling for the isolated Foundation V2 Healthcare lane. The loader writes source release, source file, source row, source field, parser execution, and source-volume gate proof rows only.

It does not create canonical objects, review decisions, publications, baselines, projections, Cube objects, product bindings, signed-in Knowledge proof, or aVa packet proof.

## Client Applicability

- All clients: none directly.
- Specific clients: none named.
- Internal only: Foundation V2 Healthcare isolated execution.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/foundation-v2/load-healthcare-source-volume-db.mjs` - adds source-file-derived plan, preflight, apply, and verify modes.
- `scripts/foundation-v2/run-golden-slice-db-aad.mjs` - allows the managed-identity launcher to route the `source-volume` target.
- `package.json` - adds Healthcare source-volume preflight, apply, and verify npm scripts.
- `Dockerfile` - packages the frozen Healthcare source package into the ACA runtime image for operator jobs.
- `scripts/foundation-v2/execute-golden-slice-db.mjs` - fixes lane-aware writer-policy schema readback so Healthcare is validated against its own tenant, namespace, release alias, and writer role.

## Volumetric Contract

The source-volume plan derives these expected counts from the frozen source package:

- CSV source files: 40.
- Source rows: 140,773.
- Source field values: 1,437,376.
- Parser-visible source families: 16.
- Frozen canonical-domain subtotal: 136,955.
- Supporting source rows outside that subtotal: 3,818.
- Maximum CSV columns in a source file: 29.

## QA / Validation

- Pass: `FOUNDATION_V2_DOMAIN=healthcare node scripts/foundation-v2/load-healthcare-source-volume-db.mjs --mode plan --out-dir /tmp/healthcare-source-volume-plan-check`.
- Pass: source-volume plan produced 40 files, 140,773 source rows, and 1,437,376 source field values.
- Pass: `node scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs`.
- Pass: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`.
- Pending until merge/deploy: ACA image contains the Healthcare source package.
- Pending until merge/deploy: governed source-volume preflight, apply, and reader verify jobs.

## Rollout Plan

Merge through PR-only `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the next digest-pinned runtime image. After runtime invariant passes, run Healthcare schema readback, source-volume preflight, source-volume apply, and source-volume reader verify with the new image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deploy before using the new job image.
- Worker image invariant: private operator job must be restored to its idle image and command after each run.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface changed; database job proof is required before progression.

## Rollback Plan

Revert this PR and redeploy through the repo-owned workflow. If the source-volume apply has already committed, preserve the isolated rows as audit evidence and supersede with a new source release only after governed review; do not mutate product providers or active baselines.

## Audit Evidence

- Prior Healthcare schema readback showed the database lane objects and non-BYPASSRLS identity were present, while verifier policy counting was still tied to default-lane strings.
- Local source-volume plan derived counts directly from the frozen source files and package manifest hashes.
- PR URL, merge commit, ACA deploy run, runtime digest, and source-volume job proof will be appended after execution.

## Known Gaps

This change does not certify the Healthcare golden slice and does not prove product consumption. It enables the first volumetric source landing/readback step for the isolated Healthcare Foundation V2 lane.
