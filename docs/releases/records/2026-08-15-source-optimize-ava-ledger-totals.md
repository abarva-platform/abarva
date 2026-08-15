# 2026-08-15-source-optimize-ava-ledger-totals — Source Optimize aVa Ledger Totals

## Release ID

`2026-08-15-source-optimize-ava-ledger-totals`

## Status

`candidate`

## Plain-English Summary

The contract-scoped Source aVa grounding now gives the model exact contract display names and
pre-summed opportunity ledger totals. This prevents the assistant from substituting a similar
contract name from generic context or recomputing chart totals from row prose.

The change keeps the existing evidence rules intact: missing evidence remains missing, realized value
still requires finance confirmation, and only values backed by reproducible calculation runs are
presented as chart-safe opportunity totals.

## Layer Impact

- Release lane: `global-control-lane`
- Product layer: Source aVa answers on contract-carrying Source surfaces receive clearer deterministic
  grounding.
- Canonical model: No schema, migration, adapter calculation, or source data changes.

## Client Applicability

- All clients: Yes, wherever Source surfaces pass a contract id to aVa.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/facts/view/ava-contract-grounding-context.ts`
- `src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/facts/view/ava-contract-grounding-context.ts src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts`
- Pending before release: full TypeScript check, release check, PR merge, ACA deploy invariant, and
  signed-in aVa smoke proof on a contract-scoped Source Optimize page.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. No manual runtime mutation, migration, data load, or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Required before claiming live-proven.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, contract-scoped aVa must preserve the visible contract name and
  use the deterministic ledger totals for chart/table narration.

## Rollback Plan

Revert the commit or roll the ACA image back to the prior healthy digest through the approved
deployment lane. The change is prompt-grounding only and has no data rollback requirement.

## Audit Evidence

- Pull request URL after creation.
- GitHub Actions deploy run after merge.
- ACA runtime invariant after deployment.
- Signed-in aVa transcript on a contract-scoped Source Optimize page.

## Known Gaps

- This does not add a native chart renderer to the chat surface. It prevents aVa from inventing or
  mis-summing chart values when it describes a chart or returns a table.
