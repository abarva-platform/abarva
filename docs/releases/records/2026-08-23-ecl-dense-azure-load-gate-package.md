# 2026-08-23-ecl-dense-azure-load-gate-package — Dense ECL Azure Load Gate Package

## Release ID

`2026-08-23-ecl-dense-azure-load-gate-package`

## Status

`candidate`

## Plain-English Summary

Adds a non-mutating gate package for the dense ECL all-layer Azure data-build step. The package prepares a future ACA Job run contract, explicit approval checklist, command plan, and independent row-for-row readback contract without loading Azure, changing product routes, deploying, promoting sources, or retiring legacy assets.

## Layer Impact

Layer 1 through Layer 4 are represented as expected readback contracts only. This change does not mutate any layer; it packages the proof and controls needed before a future private data-plane load can be approved.

## Client Applicability

- All clients: Not directly active.
- Specific clients: None.
- Internal only: ECL operator planning and gated data-build execution.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/ecl/write_ecl_dense_azure_load_gate_package.py`.
- Adds `scripts/ecl/validate_ecl_dense_azure_load_gate_package.py`.
- Adds npm scripts for gate package generation and validation.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/write_ecl_dense_azure_load_gate_package.py scripts/ecl/validate_ecl_dense_azure_load_gate_package.py`
- Pass: `npm run ecl:dense-azure-gate:package`
- Pass: `npm run ecl:dense-azure-gate:validate`
- Pass: `npm run release:check`

## Rollout Plan

Merge to main only. There is no runtime rollout, no Azure load, no data-plane mutation, no product route repointing, and no legacy retirement in this release.

## Deployment Authority

- Repo-owned deploy workflow: Not used.
- Shared runtime mutators: None.
- Approved image digest: Not applicable for this release; future execution requires a digest-pinned image.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed by this release.

## Rollback Plan

Revert this PR to remove the gate package scripts and npm entries. No data rollback is required because this release performs no data-plane mutation.

## Audit Evidence

- PR URL.
- Local command output from the QA / Validation section.
- Generated gate package under `reports/ecl-dense-azure-load-gate-package-2026-08-23`.

## Known Gaps

- Actual Azure ACA Job execution is not authorized or performed.
- Azure lab/preprod load and independent readback remain hard-gated.
- Product route/browser QA remains hard-gated and is not claimed.
