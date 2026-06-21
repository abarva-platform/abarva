# 2026-06-21-scb-truth-gates — Shared Context Brain Truth Gates

## Release ID

`2026-06-21-scb-truth-gates`

## Status

`candidate`

## Plain-English Summary

Adds deterministic release gates for the Shared Context Brain so authored data, embeddings, patterns, and expert packs cannot silently drift away from the retrievable substrate.

## Layer Impact

- `global-control-lane`: Adds repo/CI validation scripts and release-check wiring. No application route behavior changes.
- `client-data-lane`: Adds validation coverage for client context record presence and embedded vector completeness, but does not mutate client data.

## Client Applicability

- All clients: Applies to all client context tenants when run with a live database or fixture snapshot.
- Specific clients: None.
- Internal only: Release/CI operators and build agents.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/scripts/intelligence/scb-truth-gates.ts`
- `src/scripts/__tests__/scb-truth-gates.test.ts`
- `scripts/release-control/check-scb-truth-gates.mjs`
- `scripts/release-check.mjs`
- `package.json`

## QA / Validation

- PASS: `npx jest src/scripts/__tests__/scb-truth-gates.test.ts --runInBand`
- PASS: `npm run scb:truth-gates -- --static-only`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npx eslint src/scripts/intelligence/scb-truth-gates.ts src/scripts/__tests__/scb-truth-gates.test.ts`
- PASS: `npm run release:check`
- BLOCKED: Private-VNet SQL proof showed the live gate would correctly fail because `northstar-clinical` has vectorized chunks but zero `enterprise_context_records`.
- PENDING: `npm run scb:truth-gates -- --require-live` inside the private VNet before W2.4 is marked done.

## Rollout Plan

Merge to `main`. The static gate runs as part of `npm run release:check`. Live data-plane proof can be run inside the private VNet with `npm run scb:truth-gates -- --require-live`.

## Deployment Authority

- Repo-owned deploy workflow: Not changed.
- Shared runtime mutators: None.
- Approved image digest: Not applicable until merged/deployed.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No UI change. Live VNet DB proof is required before marking W2.4 done.

## Rollback Plan

Revert the checker, release-check import, package script, tests, and this release record. No migration rollback and no data rollback are required.

## Audit Evidence

- Focused Jest output from the W2.4 branch.
- Static truth-gate output from the W2.4 branch.
- Future PR and CI run for this branch.
- Future private-VNet `--require-live` output for live DB truth.

## Known Gaps

Live private-VNet truth-gate execution is pending on a real data-plane remediation: `northstar-clinical` currently has 878 vectorized chunks and 0 embedded-null-vector rows, but zero `enterprise_context_records`. This PR introduces the gate; it does not itself mutate or repair live data.
