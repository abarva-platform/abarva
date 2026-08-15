# 2026-08-15-source-optimize-ava-lifecycle-grounding — Source Optimize aVa Lifecycle Grounding

## Release ID

`2026-08-15-source-optimize-ava-lifecycle-grounding`

## Status

`candidate`

## Plain-English Summary

Source Optimize contract aVa grounding now includes the governed workflow
lifecycle state that the Optimize Contract page renders: strategy approval,
vendor outcome, Finance/Tower confirmation request, and whether the value-proof
gate is still open. This prevents a contract-grain aVa answer from treating a
visible finance-realization amount as a completed value-proof gate while the
Finance/Tower confirmation request is still pending.

The change does not calculate value, approve value, create workflow rows, or
change any tenant data. It only adds existing read-model state to the deterministic
contract grounding block passed into aVa.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 Canonical Enterprise Model: no schema or data mutation.
- Layer 4 Products: Source aVa contract grounding now projects existing
  Source Optimize lifecycle state alongside baseline, readiness, opportunity,
  and traceability facts.

## Client Applicability

- All clients: yes, for tenants using Source Optimize Contract and Source aVa.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/facts/view/ava-contract-grounding-context.ts`
- `src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts --runInBand` — 1 suite, 9 tests.
- PASS: `npx eslint src/lib/source/facts/view/ava-contract-grounding-context.ts src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts`.
- Pending before merge: broader Source Optimize focused tests, TypeScript, diff check, and release check.
- Pending after merge: repo-owned ACA deploy, runtime invariant, and live aVa verification when browser control is available.

## Rollout Plan

Open a PR and merge through the protected repository lane. The repo-owned Azure
Container Apps main deploy workflow builds and deploys the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes before claiming signed-in aVa behavior; local
  tests prove only the deterministic grounding contract.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. No data rollback
is required because this release changes only the prompt grounding projection.

## Audit Evidence

- Pull request URL after publication.
- Focused test and lint output listed above.
- ACA deploy run and runtime-invariant proof after merge.
- Signed-in aVa transcript proof after browser control is available.

## Known Gaps

This release does not run the hard 25-question aVa suite and does not provide
signed-in browser proof. It narrows one specific grounding gap: aVa now sees the
same value-proof lifecycle state that the page and operator readback enforce.
