# 2026-09-13 - Source selected-detail value overlay

## Release ID

`2026-09-13-source-selected-detail-value-overlay`

## Status

`candidate`

## Plain-English Summary

When a user opens a contract with loaded monthly evidence, Contract 360 now
uses those loaded rows for the displayed spend and commitment totals. A stale
portfolio summary row containing zero can no longer make the selected contract
look unspent or uncommitted while its detail evidence is present.

## Layer Impact

- **Products:** selected Contract 360 Story surfaces receive the authoritative
  detail-lane totals already available in the governed read model.
- **client-data-lane:** no schema or source data changes; this is a read-path
  reconciliation between existing projection and detail lanes.

## Client Applicability

- All clients: the fallback is generic and only activates when positive detail
  rows exist for the selected contract.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.evidence.test.tsx`

## QA / Validation

- Contract coverage overlay regression test: passed.
- Contract 360 lede and surface tests: passed.
- `git diff --check`: passed.
- Live signed-in proof is required after the ACA deploy; the prior proof
  identified the stale-zero rendering defect this candidate addresses.

## Rollout Plan

Merge through the protected main PR lane. Build and deploy the exact merge SHA
through `.github/workflows/aca-main-deploy.yml`, verify the digest-pinned ACA
runtime invariant, then run the signed-in Contract 360 smoke across the
selected contract's tabs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: record the exact digest from the final deploy.
- ACA runtime invariant: template, 100% traffic revision, and required worker
  images must match that digest.
- Worker image invariant: required worker images must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the application PR through the protected PR lane and redeploy the prior
approved digest. No data rollback is required because this change does not
mutate the data plane.

## Audit Evidence

- PR and CI checks for the merge candidate.
- ACA deployment artifact and runtime invariant for the exact merge SHA.
- Signed-in Contract 360 Story and tab smoke output.

## Known Gaps

Portfolio command aggregates still require a separate reconciliation with the
fresh Azure-loaded depth population. This change does not classify register
contracts without an authoritative mapping source and does not claim that the
full register is evidence-complete.
