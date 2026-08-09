# 2026-08-09-source-opportunity-truth-closure — Source Opportunity Truth Closure

## Release ID

`2026-08-09-source-opportunity-truth-closure`

## Status

`candidate`

## Plain-English Summary

This release closes a narrow Source 360 semantic gap: Contract 360, Door 1, and aVa must read the same governed commercial opportunity rows for a selected contract. It adds the missing labor rate-card variance as its own atomic opportunity, refreshes reused optimization events from current opportunity state, bridges selected governed opportunities into Door 1 diagnosis when legacy event facts are empty, normalizes service-credit API compatibility fields from the governed evidence summary, and moves Source aVa off the older four-ledger wording.

## Layer Impact

Affected lane: `global-control-lane`.

Layer 3 canonical/projection logic: Source opportunity projection code now includes VMS/rate-card variance as a separate recoverable-leakage opportunity and projects finance confirmation dates no later than the latest loaded monthly evidence period.

Layer 4 PRODUCTS: Contract 360 API compatibility fields, Door 1 diagnosis output, and Source aVa artifacts now consume the governed opportunity/evidence projection rather than maintaining separate visible truth.

## Client Applicability

- All clients: yes, shared Source optimization behavior.
- Specific clients: no tenant-specific product logic added.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source feature gates still apply.

## Changes Included

- `src/lib/source/data-model/contract-optimization-opportunity.ts`
- `scripts/source/project-contract-optimization-spine.ts`
- `src/app/api/source/workspace/contract/[contractId]/route.ts`
- `src/app/api/source/workspace/contract/[contractId]/optimization/route.ts`
- `src/app/api/v1/source/[eventId]/door1/diagnose/route.ts`
- `src/lib/source/door1/governed-opportunity-diagnosis.ts`
- `src/lib/source/ava/source-workspace-visual-answer.ts`
- Focused unit tests for opportunity projection, Door 1 bridging, route helpers, and aVa conflict-control behavior.

## QA / Validation

- `pass` `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/source/door1/__tests__/governed-opportunity-diagnosis.test.ts 'src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts' --runInBand`
- `pass` Focused ESLint on all changed Source/Door1/aVa files and tests.
- `pass` `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- `pass` `git diff --check`
- `pending` Source opportunity projection job apply against the target database.
- `pending` Live signed-in Contract 360, Door 1, and aVa browser proof after merge/deploy and projection apply.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. Then run the approved Source data projection job for the selected tenant/dataset version so the persisted opportunity/calculation/fact rows are regenerated from the same code path. Final certification requires live signed-in browser and API proof after both code deploy and projection apply.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR outside the repo-owned deploy workflow
- Approved image digest: produced by the repo-owned deploy workflow after merge
- ACA runtime invariant: required before claiming live proof
- Worker image invariant: required for any Source data projection job used to apply persisted rows
- Feature/env flag update path: none
- Live signed-in proof required: yes, Source workspace Contract 360, Door 1 diagnosis/approval, and Source aVa

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps workflow. If the projection job has been applied, rerun the prior approved projection version or restore the prior proof-backed database snapshot for the affected tenant/dataset version.

## Audit Evidence

PR, merge commit, deploy run, ACA runtime invariant, Source projection job output, focused Jest output, focused ESLint output, TypeScript output, and signed-in browser/aVa proof bundle.

## Known Gaps

This candidate does not itself prove live database mutation or signed-in product behavior. It must not be treated as final QA certification until the Source projection job and live browser/aVa acceptance run have both produced evidence.
