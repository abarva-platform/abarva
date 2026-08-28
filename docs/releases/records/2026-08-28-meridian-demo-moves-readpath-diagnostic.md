# 2026-08-28-meridian-demo-moves-readpath-diagnostic — Meridian Demo Moves Read-Path Diagnostic

## Release ID

`2026-08-28-meridian-demo-moves-readpath-diagnostic`

## Status

`candidate`

## Plain-English Summary

Adds a read-only operator diagnostic for the Meridian synthetic demo Moves route. The diagnostic checks whether the loaded Moves activation rows line up with the client row and signed-in proof identities that the product route uses.

## Layer Impact

Release lane: `internal-admin`.

Layer 2/operations: adds a read-only diagnostic script and npm entrypoint for the governed operator job.

Layer 4/products: no product route or UI behavior changes. The script exists to classify why a loaded demo portfolio can still render as empty.

## Client Applicability

- All clients: No.
- Specific clients: Meridian synthetic demo tenant only.
- Internal only: Yes, operator diagnostic.
- Public/demo only: Yes, synthetic demo proof lane.
- Feature flag: Not applicable.

## Changes Included

- `scripts/ecl/diagnose_meridian_moves_live_read_path.mjs`
- `package.json` script `ecl:meridian-moves-live-readpath:diagnose`

## QA / Validation

- Pass: `node --check scripts/ecl/diagnose_meridian_moves_live_read_path.mjs`
- Pass: `npm run ecl:meridian-moves-live-readpath:diagnose -- --plan-only`
- Blocked until deployment: governed ACA operator job execution with the deployed digest-pinned image.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow builds the image. After deployment, run the diagnostic through the governed ACA operator job with the digest-pinned deployed image and the existing Azure Postgres secret.

## Deployment Authority

- Repo-owned deploy workflow: Required before the new npm script can run inside the shared operator image.
- Shared runtime mutators: None from this change.
- Approved image digest: Resolved by the main ACA deploy workflow.
- ACA runtime invariant: Required before claiming the diagnostic is deployed.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this diagnostic. Product proof happens after the classified read-path fix.

## Rollback Plan

Revert the PR. The diagnostic is read-only and has no database side effects.

## Audit Evidence

- Pull request for this release.
- Local syntax and plan-only output.
- ACA operator job output after deployment.

## Known Gaps

The diagnostic classifies the read-path mismatch. It does not itself repoint, mutate data, or change access policy.
