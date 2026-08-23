# 2026-08-23-ecl-source-workspace-browser-proof — Source Workspace ECL Browser Proof

## Release ID

`2026-08-23-ecl-source-workspace-browser-proof`

## Status

`candidate`

## Plain-English Summary

Adds a focused browser-surface test proving the Source workspace can render from the flagged ECL projection adapter without falling into an empty state. The slice also fixes a visible singular/plural copy defect in the Source executive verdict.

## Layer Impact

- Layer 4 Products: Source workspace presentation and proof coverage only. The default runtime provider remains unchanged.
- Layer 3 Canonical Enterprise Model: No schema, migration, object, relationship, metric, or data-plane changes.

## Client Applicability

- All clients: The grammar fix applies when the Source cockpit renders one contract in the governed decision set.
- Specific clients: None.
- Internal only: The new Jest proof is an internal QA gate.
- Public/demo only: None.
- Feature flag: Existing `SOURCE_WORKSPACE_PROVIDER=ecl_projection` remains required to use the ECL projection adapter.

## Changes Included

- Adds `WorkspaceClient.ecl-browser.test.tsx`, a jsdom render proof that loads local ECL projection CSVs through the flagged adapter and renders the real Source workspace component.
- Updates the Source cockpit verdict copy so one contract reads `sits` and multiple contracts read `sit`.

## QA / Validation

- PASS — `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- PASS — `python3 scripts/ecl/run_commercial_contract_proof.py --out-dir /tmp/ecl-source-browser-proof`
- PASS — `python3 scripts/ecl/validate_commercial_proof_acceptance.py --out-dir /tmp/ecl-source-browser-proof`
- PASS — `python3 scripts/ecl/render_source_360_contract_preview.py --out-dir /tmp/ecl-source-browser-proof --contract-id MER-CTR-RCM-001`
- PASS — `python3 scripts/ecl/render_source_360_contract_preview.py --out-dir /tmp/ecl-source-browser-proof --contract-id MER-CTR-SSO-BPO-001 --require-weak-contract`
- PASS — `python3 scripts/ecl/validate_source_360_route_readiness.py --ecl-out-dir /tmp/ecl-source-browser-proof --out-dir /tmp/ecl-source-browser-route-readiness`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps deploy workflow may deploy the code and test changes. No production environment flag is changed by this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for normal main deployment.
- Shared runtime mutators: Not used.
- Approved image digest: Resolved by the repo-owned ACA deploy workflow if merged.
- ACA runtime invariant: Verified by the repo-owned ACA deploy workflow if deployed.
- Worker image invariant: Verified by the repo-owned ACA deploy workflow if deployed.
- Feature/env flag update path: Not part of this release.
- Live signed-in proof required: Required before claiming the production Source route is using ECL projection data.

## Rollback Plan

Revert the pull request. This removes the browser-surface proof and restores the prior cockpit copy. No data rollback is required.

## Audit Evidence

- Focused Jest render proof for flagged ECL Source workspace path.
- Local commercial proof and Source route-readiness outputs in `/tmp/ecl-source-browser-proof` and `/tmp/ecl-source-browser-route-readiness`.

## Known Gaps

- This does not repoint the production Source workspace to ECL.
- This does not claim live signed-in ECL-provider browser proof.
