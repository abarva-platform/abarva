# 2026-08-15-source-optimize-client-payload-trim — Source Optimize Client Payload Trim

## Release ID

`2026-08-15-source-optimize-client-payload-trim`

## Status

`candidate`

## Plain-English Summary

Source Optimize now keeps raw calculation input lines out of the initial browser payload. The page
still receives the reproducible amount, formula, inclusion counts, exclusion counts, and pending
counts needed for traceability. The line-level evidence remains in the governed data layer and
server read paths for drill-down and audit use.

This is a rendering-stability change only. It does not change any contract calculation, readiness
rule, evidence state, entitlement rule, or workflow gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products, Source: reduces the client payload for the Optimize page so the browser does not
  serialize raw calculation rows it does not display.
- Layer 3 Canonical Model: no schema, migration, calculation, or source data change.

## Client Applicability

- All clients: yes, for tenants using the shared Source Optimize page.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/optimize/page.tsx`
- `src/lib/source/data-model/contract-optimization-client-payload.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — 21 tests passed. Jest reported existing duplicate manual mock warnings only.
- PASS: `npx eslint 'src/app/(maestro)/source/optimize/page.tsx' src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/contract-optimization-client-payload.ts`.
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- PASS: `git diff --check`.
- NOT RUN YET: `npm run release:check` after this record update.
- BLOCKED UNTIL DEPLOYMENT: ACA runtime invariant and live signed-in browser proof.

## Rollout Plan

Open a PR, merge through the protected repository lane, and let the repo-owned Azure Container Apps
main deploy workflow publish the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for the Source Optimize page render path.

## Rollback Plan

Revert this PR. The page will again receive raw calculation input lines in its initial payload. No
data rollback is required.

## Audit Evidence

- PR URL: pending.
- GitHub Actions deploy run: pending.
- ACA runtime invariant: pending.
- Live signed-in proof: pending.

## Known Gaps

This does not solve every possible browser-rendering issue on Source Optimize. It removes one
unnecessary high-volume payload path while preserving governed calculation totals and traceability
counts.
