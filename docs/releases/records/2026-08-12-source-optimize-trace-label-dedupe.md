# 2026-08-12-source-optimize-trace-label-dedupe — Source Optimize Trace Label Wording

## Release ID

`2026-08-12-source-optimize-trace-label-dedupe`

## Status

`candidate`

## Plain-English Summary

On the Optimize Contract opportunity table, a row with no calculation run read "No calculation run
No calculation run — amount cannot be reproduced". The cell printed a fixed heading and then a trace
label that already said the same thing. The heading is now dropped when there is no calculation run,
so the row states the point once. Rows that do have a calculation run still show their included,
pending, and excluded line counts above the trace label.

Found by reading the deployed page after the traceability release.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract presentation only.
- Canonical model: Nothing changed. No data, adapter, calculation, or classification logic is affected;
  this only removes a duplicated phrase from one table cell.

## Client Applicability

- All clients: Yes, wherever the shared Source Optimize Contract page is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` (9 tests)
- Pass: `npx eslint src/components/source/SourceOptimizeContractPage.tsx`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. No manual runtime mutation, migration, or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image, and revision health match
  the deployed digest before claiming live-proven.
- Worker image invariant: Not affected; no worker job changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — an untraced opportunity row must state the point once.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Wording-only change; rollback carries no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in browser proof of the opportunity table after deploy.

## Known Gaps

None known. The underlying missing calculation runs remain separate data-plane work, tracked in the
traceability release record.
