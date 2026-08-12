# 2026-08-12-source-optimize-evidence-readiness-board — Source Optimize Evidence Readiness Board

## Release ID

`2026-08-12-source-optimize-evidence-readiness-board`

## Status

`candidate`

## Plain-English Summary

The Optimize Contract page now shows a governed evidence readiness board: one row per required
evidence family, stating what it is, whether it is required or optional, which source system it comes
from, which role owns it, the grain and history needed, the template file to fill, whether the
evidence has actually been loaded, how far extraction and review have taken it, how many governed
fact objects exist, what it blocks, and what to do next.

Two things behind this mattered. The page already had a governed evidence pack available on the
server but never passed it to the UI, so observed evidence state was invisible to the user. And the
evidence board previously listed only opportunity-driven asks, so a user could not see the full
evidence spine or tell the difference between "we have this" and "nobody has asked for this yet".

Missing evidence is reported as missing. It is never displayed as a zero amount, and it is never
inferred from the contract's identity — a family with no governed evidence reads
`no governed evidence` / `Not loaded` / `parser not run`.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract presentation and its view-model. The requirement spine comes
  from the existing governed evidence template registry; observed state comes only from the existing
  governed evidence pack.
- Canonical model: No canonical data, source adapter, cube, migration, or calculation logic changed.
  No new dataset is loaded, so no dataset manifest is required.

## Client Applicability

- All clients: Yes, wherever the shared Source Optimize Contract page is available.
- Specific clients: None. The requirement spine is identical for every tenant and contract; only the
  observed evidence differs.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/contract-optimization-evidence-readiness.ts` (new view-model)
- `src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts` (new)
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`
- `src/app/(maestro)/source/optimize/page.tsx` (passes the already-fetched evidence pack to the page)

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` (17 tests)
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Not done locally: browser verification. The repo dev-server launch config targets the primary
  worktree, so a local preview would have exercised a different branch. Visual and behavioural
  verification is by signed-in proof on `https://app.abarva.ai` after deploy, recorded below.

Coverage of the behaviours that matter: every family missing when no pack exists; owner, template,
grain, and artifact impact present on a missing row; governed database and canary evidence-ref
vocabularies both matched; weakest evidence class and parser state win when a family has several
inputs; an optional family never blocks readiness; fact-object references deduplicated; and two
contracts differing by evidence rather than by contract id.

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
- Live signed-in proof required: Yes — `/source/optimize?contractId=<governed contract>` must show the
  readiness board with correct required/optional, owner, template, load, and parser states.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. The change is presentation and view-model only, so rollback carries no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in Source Optimize browser proof after deploy, including the readiness board rows and the
  required-evidenced count.

## Known Gaps

- Two required families (`ticket_volume`, `staffing_model`) have no governed source in either evidence
  vocabulary today, so they always read as missing. That is the honest current state, not a defect of
  this change; loading those sources is separate data-plane work.
- Baseline lock persistence, opportunity calculation-run lineage, and the approval gate are not part of
  this change.
- The client-upload path is not wired to these rows yet, which is why the column reports load
  provenance (`system loaded` / `document loaded` / `human confirmed`) rather than claiming a client
  uploaded a file.
