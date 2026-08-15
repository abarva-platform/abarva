# 2026-08-15-source-optimize-finance-handoff-pending-gate — Source Optimize Finance Handoff Pending Gate

## Release ID

`2026-08-15-source-optimize-finance-handoff-pending-gate`

## Status

`candidate`

## Plain-English Summary

Source Optimize now keeps the final value-proof step blocked while a Finance/Tower confirmation request is still pending. A finance-confirmed realization row can be visible, but the workflow rail will not mark value proof complete until the Finance/Tower confirmation request is approved.

This is a governance correction: pending handoff remains pending, and no value amount or status is made cleaner than the underlying approval evidence supports.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products, Source: adjusts the shared Source Optimize workflow projection and visible page state.
- Layer 3 Canonical Model: no schema or data changes.

## Client Applicability

- All clients: yes, for tenants using the shared Source Optimize workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/contract-optimization-workflow-step.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- PASS: `npx jest src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — 31 tests passed. Jest reported existing duplicate manual mock warnings only.
- PASS: `npx eslint src/lib/source/data-model/contract-optimization-workflow-step.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`.
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- PASS: `git diff --check`.
- NOT RUN YET: `npm run release:check` after this record update.
- BLOCKED UNTIL DEPLOYMENT: repo-owned ACA deployment and runtime invariant.
- BLOCKED UNTIL DEPLOYMENT: signed-in Source Optimize proof or, if browser automation remains unstable, an explicit partial-proof note plus independent data/read-model readback.

## Rollout Plan

Open a PR, merge through the protected repository lane, and let the repo-owned Azure Container Apps main deploy workflow publish the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: required before claiming live.
- Live signed-in proof required: yes for the final Source Optimize value-proof state.

## Rollback Plan

Revert this PR. The previous behavior returns, where a pending Finance/Tower confirmation request may close the value-proof rail when a realization row exists.

## Audit Evidence

- PR URL: pending.
- Local validation output: pending.
- Deploy and live proof: pending.

## Known Gaps

This release does not create Finance/Tower approval decisions or finance realization rows. It only prevents a pending Finance/Tower request from being displayed as a completed value-proof gate.
