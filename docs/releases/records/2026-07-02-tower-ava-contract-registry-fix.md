# 2026-07-02 Tower aVa Contract Registry Fix

## Release ID

`2026-07-02-tower-ava-contract-registry-fix`

## Status

`candidate`

## Plain-English Summary

Tower aVa can now answer the new deterministic vendor, contract, risk, and evidence-trust question families without failing while writing its audit trace. The visible routing remains specific to the user question, but trace rows are persisted through Tower question contracts that already exist in the live governed registry.

## Layer Impact

- `global-control-lane`: Updates shared Tower aVa answer plumbing for all clients using the CIO Tower route.
- `client-data-lane`: Does not change tenant facts, measures, source files, relationships, or loaders. It only prevents trace persistence from referencing fallback contract aliases that are not yet first-class live registry rows.

## Client Applicability

- All clients: Yes, for Tower aVa question routing and answer trace persistence.
- Specific clients: The immediate regression was proven on Lakeshore Holdings and SkyHarbor Air.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: maps fallback route-family aliases to existing registry-backed contract keys when inserting `cio_tower.prompt_packages` and `cio_tower.answer_traces`.
- `src/lib/cio-tower/__tests__/answer.test.ts`: adds regression coverage for the trace-contract mapping.

## QA / Validation

- Pass: `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts`.
- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand` (`29` tests passed; repo-level duplicate mock warnings are unchanged).
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Not run yet: `npm run release:check`; will be rerun after this record is updated.
- Blocked until deploy: exact Lakeshore/SkyHarbor 50x2 Tower aVa audit rerun against the signed-in deployed app.
- Blocked until deploy: confirmation that `prompt_packages_contract_key_fkey` failures are zero.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, wait for the new ACA revision to become healthy, shift 100% traffic, then rerun the signed-in Tower audit.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No local or non-main ACA mutation.
- Approved image digest: Captured by ACA main deploy evidence after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower aVa 50x2 audit.

## Rollback Plan

Revert the PR and redeploy `main` through the ACA main deploy workflow. No schema or data rollback is required.

## Audit Evidence

- PR URL: to be added after opening.
- CI run: to be added after opening.
- Deploy proof: to be added after ACA deployment.
- Live audit report: to be added after rerun.

## Known Gaps

This does not promote `tower_vendor_contract_gap` or `tower_evidence_trust` into first-class `cio_tower.question_contracts` rows. It keeps the app stable while preserving the routed contract inside the deterministic packet. A future registry migration can add those families as first-class rows if desired.
