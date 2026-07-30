# 2026-07-30-airline-variance-sample-register-log — Airline variance sample register logging

## Release ID

`2026-07-30-airline-variance-sample-register-log`

## Status

`candidate`

## Plain-English Summary

The Airline live reconciliation readback now prints compact diagnostic samples for unresolved variance gates directly in governed VNet job logs. Operators can see which source files, rows, fields, and projection hashes are involved without downloading the private proof bundle first.

## Layer Impact

- `client-data-lane`: read-only audit tooling for Airline Demo New reconciliation evidence.
- `internal-admin`: improves operator diagnostics in the governed VNet job output.

No client-visible product page, tenant data, review decision, publication, baseline, projection, provider, or runtime answer path is changed by this release.

## Client Applicability

- All clients: none.
- Specific clients: Airline Demo New audit tooling only.
- Internal only: yes, governed reconciliation operator diagnostics.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- `docs/releases/records/2026-07-30-airline-variance-sample-register-log.md`

## QA / Validation

- Pass: `node --check scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- Pass: source-only smoke with `--skip-db --no-field-detail`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending until rollout: governed VNet readback log includes missing-row, unaccounted-field, and projection-hash samples.

## Rollout Plan

Merge to main through PR, deploy through the repo-owned ACA main deploy workflow, then rerun the read-only Airline reconciliation job inside the VNet using the deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: to be captured after deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is read-only operator audit logging. VNet job proof is required.

## Rollback Plan

Revert the script-only logging change and redeploy through the ACA main workflow. Existing Airline data-plane state is unaffected.

## Audit Evidence

- PR URL and CI checks.
- ACA deploy run and runtime invariant after merge.
- Governed VNet readback job logs showing `FAILING_VARIANCE_REGISTER` with diagnostic samples.
- Uploaded private proof bundle pointer from the readback job.

## Known Gaps

This release does not repair the variance gates. It only exposes the row, field, and projection samples needed to choose the correct repair.
