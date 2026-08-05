# 2026-08-04-retired-layer-purge-operator — Harden Retired Layer Purge Operator

## Release ID

`2026-08-04-retired-layer-purge-operator`

## Status

`candidate`

## Plain-English Summary

This release hardens the internal operator script used to retire old physical data layers. It fixes proof output in the Azure Container Apps job container, adds an explicit apply-mode npm script for the governed operator wrapper, and emits structured proof JSON so a run can be audited after completion.

## Layer Impact

Client intake and source adapters: no change.

Canonical model and product projections: no runtime read-path change. The script is an internal data-plane operation tool for retiring superseded layer schemas after separate review.

Operations: improves the ACA private operator job path for dry-run and apply evidence.

## Client Applicability

- All clients: no direct product behavior change.
- Specific clients: none.
- Internal only: AbarVa operators running approved data-plane retirement jobs.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ops/purge-retired-data-layers.mjs`: defaults proof output to writable `/tmp`, accepts env-driven apply/schema controls, and emits `retired_data_layer_purge_proof`.
- `package.json`: adds `ops:purge-retired-data-layers:apply` for the ACA operator wrapper, which does not forward arbitrary CLI args.

## QA / Validation

- PASS: `node scripts/ops/purge-retired-data-layers.mjs --validate-only`
- PASS: `npx eslint scripts/ops/purge-retired-data-layers.mjs`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `npm run secrets:staged`
- NOT RUN: destructive apply. The actual apply remains a separate operator execution and must not be inferred from this code release.

## Rollout Plan

Merge through PR to `main`, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then run the private ACA operator job first in dry-run mode. Run apply only if the dry-run proof shows no outside dependencies or an explicit reviewed dependency waiver exists.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: ACA web image and worker job images through the main deploy workflow only.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is an internal operator tool. Data-plane proof is required for any subsequent purge execution.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. If a later purge apply has already run, schema/data restoration must use the operator proof and backup procedure from that separate data-plane run.

## Audit Evidence

- PR URL after creation.
- CI checks on the PR.
- ACA main deploy evidence after merge.
- Private operator dry-run/apply proof folders for actual runs.

## Known Gaps

This release does not delete data by itself. Tenant-key row purge across active schemas is a separate job from old-schema retirement.
