# 2026-08-12-source-optimize-opportunity-traceability — Source Optimize Opportunity Traceability

## Release ID

`2026-08-12-source-optimize-opportunity-traceability`

## Status

`candidate`

## Plain-English Summary

The Optimize Contract opportunity table showed dollar amounts that nothing could rebuild. On the
deployed product, four of six opportunity rows for a governed contract displayed amounts — $2.4M,
$2.0M, $1.3M, $755K — next to the words "No calculation run", and the headline "potential" totals for
each value class summed every stated amount whether or not a calculation run stood behind it. An
executive reading that total could not tell reproducible value from an unbacked figure.

Each opportunity row now reports whether its amount can actually be reproduced:

- **traced** — a calculation run exists and agrees with the stated amount
- **restated** — a calculation run exists but disagrees with the stated amount
- **untraced** — an amount is stated with no calculation run behind it
- **not sized** — no amount is claimed at all, reported as such rather than as zero

Below the table, reproducible value and non-reproducible value are stated as separate totals, with an
explicit line that only the reproducible total may be used outside the workspace.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract presentation and a new derived view-model.
- Canonical model: No canonical data, adapter, migration, or stored calculation changed. The existing
  `potentialRecoverableUsd` / `potentialAvoidableUsd` / `potentialNegotiableUsd` fields are read but
  deliberately left untouched so no other consumer's meaning shifts; traceability is derived in the
  view layer instead.

## Client Applicability

- All clients: Yes, wherever the shared Source Optimize Contract page is available.
- Specific clients: None. Classification depends only on whether a calculation run reproduces the
  amount, never on tenant, vendor, or contract identity.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/contract-optimization-traceability.ts` (new)
- `src/lib/source/data-model/__tests__/contract-optimization-traceability.test.ts` (new)
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- Pass: `npx jest` on both suites — 18 tests, including 9 new traceability cases and 1 new page case
  proving a $2.4M amount with no calculation run stays out of the reproducible total
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`

Value classes are never netted against each other: recoverable leakage, avoided cost, and negotiated
improvement are summed separately, so a traced figure in one class cannot offset an untraced figure in
another.

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
- Live signed-in proof required: Yes — the opportunity table must label each row's trace state and show
  reproducible and non-reproducible totals separately.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Presentation and derived view-model only; rollback carries no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in browser proof of the opportunity table trace labels and split totals after deploy.

## Known Gaps

- This makes the gap visible; it does not create the missing calculation runs. Persisting calculation
  lineage for the opportunity rows that lack it is separate data-plane work.
- The stored `potential*Usd` fields still sum every stated amount. They are unchanged here on purpose,
  to avoid shifting meaning for other consumers; any surface quoting them externally should move to the
  reproducible total.
- Overlap between opportunity rows is reported by the existing `overlapTreatment` field and is not
  re-derived here.
