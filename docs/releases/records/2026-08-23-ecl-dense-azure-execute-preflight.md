# 2026-08-23-ecl-dense-azure-execute-preflight — Dense ECL Azure Execute Preflight

## Release ID

`2026-08-23-ecl-dense-azure-execute-preflight`

## Status

`candidate`

## Plain-English Summary

Adds a non-mutating preflight for a future dense ECL Azure execute approval. The script validates that a filled approval manifest is not the template, has all required acknowledgements, uses a digest-pinned image, preserves no-route/no-retirement boundaries, and points to the row-for-row readback contract before an operator can run the future ACA Job command.

## Layer Impact

Release lane: `internal-admin`.

No data layer changes. The release adds a control check that protects the future transition from local dense ECL proof to Azure lab/preprod load and independent readback.

## Client Applicability

- All clients: Not directly active.
- Specific clients: None.
- Internal only: ECL operator approval workflow.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/ecl/validate_ecl_dense_azure_execute_gate.py`.
- Adds `ecl:dense-azure-gate:execute-preflight`.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/validate_ecl_dense_azure_execute_gate.py`
- Pass: `npm run ecl:dense-azure-gate:package`
- Pass: `npm run ecl:dense-azure-gate:execute-preflight -- --expect-template-rejection`
- Pass: `npm run release:check`

## Rollout Plan

Merge to main only. Future Azure execution still requires a separate human-filled approval manifest, digest-pinned image, target data-plane binding, secret bindings, and independent readback.

## Deployment Authority

- Repo-owned deploy workflow: Not used.
- Shared runtime mutators: None.
- Approved image digest: Not provided or used in this release.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed by this release.

## Rollback Plan

Revert this PR to remove the execute preflight script and npm entry. No data rollback is required because this release performs no data-plane mutation.

## Audit Evidence

- PR URL.
- Local command output from the QA / Validation section.

## Known Gaps

- Actual Azure ACA Job execution is not authorized or performed.
- Azure lab/preprod load and independent readback remain hard-gated.
- Product route/browser QA remains hard-gated and is not claimed.
