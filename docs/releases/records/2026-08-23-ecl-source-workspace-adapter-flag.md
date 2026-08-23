# 2026-08-23-ecl-source-workspace-adapter-flag — ECL Source Workspace Adapter Flag

## Release ID

`2026-08-23-ecl-source-workspace-adapter-flag`

## Status

`candidate`

## Plain-English Summary

Adds an explicit server-side Source workspace provider flag that can load the local ECL Source 360 projection CSVs for adapter QA. The existing Azure-backed Source workspace remains the default path; the ECL path runs only when `SOURCE_WORKSPACE_PROVIDER=ecl_projection` and `SOURCE_WORKSPACE_ECL_PROJECTION_DIR` are both set.

## Layer Impact

- Layer 1 Client Intake: no intake files are changed.
- Layer 2 Source Adapters: adds a flagged adapter bridge from local ECL projection artifacts into the existing Source workspace portfolio contract.
- Layer 3 Canonical Model: no schema, migration, Azure data-plane, or active tenant data change.
- Layer 4 Products: Source workspace can be exercised against ECL projections in a controlled environment, but the live route is not repointed by default.

## Client Applicability

- All clients: no default runtime behavior change.
- Specific clients: none.
- Internal only: local adapter QA and route-readiness validation.
- Public/demo only: none.
- Feature flag: `SOURCE_WORKSPACE_PROVIDER=ecl_projection` with `SOURCE_WORKSPACE_ECL_PROJECTION_DIR`.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`
- `scripts/ecl/validate_source_360_route_readiness.py`

## QA / Validation

- Pass: `python3 scripts/ecl/run_commercial_contract_proof.py --out-dir /tmp/ecl-source-adapter-proof`
- Pass: `python3 scripts/ecl/validate_commercial_proof_acceptance.py --out-dir /tmp/ecl-source-adapter-proof`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 scripts/ecl/validate_source_360_route_readiness.py --out-dir /tmp/ecl-source-adapter-route-readiness-v2`
- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to main after PR checks pass. This does not change the default Source workspace provider. Any ECL-backed route/browser test must set the explicit environment variables in a controlled environment before product-route adoption.

## Deployment Authority

- Repo-owned deploy workflow: main merge may trigger the standard ACA workflow.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required if the repo-owned workflow deploys.
- Worker image invariant: not affected.
- Feature/env flag update path: closed gate; no shared runtime flag is changed by this PR.
- Live signed-in proof required: required before any future claim that the Source workspace is using ECL projections in a live signed-in route.

## Rollback Plan

Revert the PR. Since legacy remains the default provider and no data-plane changes are made, rollback is code-only.

## Audit Evidence

- Focused adapter Jest test.
- Source route-readiness summary.
- ECL no-stop execution queue output.
- Local commercial proof acceptance summary.
- TypeScript compile.
- PR checks and release check.

## Known Gaps

Signed-in browser QA with the ECL provider flag, production environment flagging, Azure data-plane load, and any default route repointing remain closed gates.
