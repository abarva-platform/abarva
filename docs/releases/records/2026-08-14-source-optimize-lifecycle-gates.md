# 2026-08-14-source-optimize-lifecycle-gates — Source Optimize Lifecycle Gates

## Release ID

`2026-08-14-source-optimize-lifecycle-gates`

## Status

`candidate`

## Plain-English Summary

Source Optimize now separates calculated opportunity readiness from actual workflow lifecycle state. A contract can have a calculated target position, but the 7-step Optimize journey will not advance into approval or value-proof stages until governed approval-request and negotiated-outcome rows exist. This prevents the product from implying that vendor outreach, approval, or agreement work has happened when only opportunity evidence has been calculated.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Source product projection: updates Optimize Contract rail semantics, decision brief copy, and aVa contract grounding to use existing Source read-model lifecycle rows.
- Layer 3 — Canonical model: no schema, migration, or data changes. Existing approval-request and negotiated-outcome projections are consumed more strictly.

## Client Applicability

- All clients: yes, for tenants with Source Optimize enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none changed.

## Changes Included

- `src/lib/source/data-model/contract-optimization-workflow-step.ts`
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- Focused Jest suite passed:
  `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts --runInBand`
  - Result: 3 suites passed, 31 tests passed.
- Broader typecheck, lint, release check, and live proof are pending in this candidate record.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image to the shared Product/Lab runtime. No data job, migration, feature flag, or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy proof.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for the Source Optimize page and aVa contract grounding behavior.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. Because this release changes only Layer 4 projection semantics and tests, rollback does not require database rollback.

## Audit Evidence

- PR URL: pending.
- Focused test command and output above.
- ACA workflow run, runtime invariant, and signed-in proof to be attached after merge/deploy.

## Known Gaps

- This release does not create approval requests or negotiated outcomes. It only prevents the workflow from treating calculated opportunity rows as those lifecycle events.
