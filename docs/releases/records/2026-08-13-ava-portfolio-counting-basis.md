# 2026-08-13-ava-portfolio-counting-basis — aVa States Its Portfolio Counting Basis

## Release ID

`2026-08-13-ava-portfolio-counting-basis`

## Status

`candidate`

## Plain-English Summary

aVa reported 121 contracts across 30 vendors for a tenant whose Source Workspace header reported 100
contracts and 60 vendors. Read as a straight contradiction, that destroys trust in every other number
aVa gives.

It is not a contradiction. The two surfaces count different things. The workspace header counts
contract **families** from the active Source V4 snapshot; aVa counts contract **rows** in
`source.contract_360` after supplemental rows are excluded. One contract family can span several
contract rows. The workspace already knows these can differ — its portfolio adapter carries a
`mismatchWarning` for exactly this case.

So the defect was the missing basis, not the arithmetic. aVa now states what it is counting and from
which table, and is told that another Source surface may count a different unit — so if a user quotes a
different figure, it explains the two units instead of silently picking one or conceding it was wrong.

## Layer Impact

- Release lane: `global-control-lane`
- Products: aVa on Source surfaces.
- Canonical model: No canonical data, adapter, migration, or calculation changed. The same
  `summarizePortfolio` output is quoted; only its label and an accompanying reconciliation instruction
  changed.

## Client Applicability

- All clients: Yes, on any Source surface where portfolio grounding is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/facts/view/ava-portfolio-grounding-context.ts`
- `src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts` — 4
  tests, including a new one asserting the counting basis and the reconciliation instruction travel
  with the figures
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`

The existing anti-divergence test still passes unchanged: the block continues to contain
`Contracts: 3` and `Vendors: 2` for its fixture, so the numbers themselves are untouched.

Evidence that the two units are legitimately different, rather than one being wrong:
`src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts` computes
`exploreMatchesV4` and emits a warning describing "contracts / vendors from source.contract_360" versus
"contract families / vendors" in the V4 snapshot.

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
- Live signed-in proof required: Yes — a portfolio count question must return the figure together with
  the unit and table it came from.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Wording and instruction only; no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in aVa answer to a portfolio count question after deploy.
- Finding that motivated it: `docs/testing/source-ava-hard-qa-2026-08-12.md` (AVA-S-02).

## Known Gaps

- The two surfaces still present different headline numbers. This makes each one explainable rather
  than making them identical. If the product should show a single contract count everywhere, that is a
  separate decision about which unit is the executive-facing one.
- The equivalent vendor-set divergence on the Responses stage (aVa naming a vendor the stage does not
  show) is recorded in `docs/testing/source-vendor-response-parsing-assessment-2026-08-13.md` and is not
  addressed here.
