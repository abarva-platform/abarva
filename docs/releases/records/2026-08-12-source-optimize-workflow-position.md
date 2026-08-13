# 2026-08-12-source-optimize-workflow-position — Source Optimize Workflow Position

## Release ID

`2026-08-12-source-optimize-workflow-position`

## Status

`candidate`

## Plain-English Summary

The Optimize Contract stage rail did not track the case. It highlighted step 2 whenever a contract was
selected and step 1 whenever one was not — a fixed position, regardless of whether the baseline was
locked, the evidence was in, or anything had been approved. Nothing on the page said what to do next.

The rail is now driven by the case's real state, and a single next-decision bar sits directly beneath
it naming the one action to take and what is blocking it.

A step is only marked complete when its own gate is satisfied:

1. **Select contract** — a governed contract is selected
2. **Lock baseline** — the commercial baseline is ready (a conflict blocks here)
3. **Read evidence** — no required evidence family is missing
4. **Diagnose opportunity** — at least one opportunity is validated and every stated amount is
   reproducible from a calculation run
5. **Build strategy** — a negotiation target position exists
6. **Approve and execute** — an approved position or vendor agreement is recorded
7. **Prove value** — Finance has confirmed realized value

Steps after the current one are never shown as done, so a case cannot look like it has advanced past
work it has not done.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract presentation and a new derived view-model.
- Canonical model: No canonical data, adapter, migration, or stored state changed. Position is derived
  at read time from existing governed fields — contract selection, baseline status, evidence readiness,
  amount traceability, and the opportunity maturity stage.

## Client Applicability

- All clients: Yes, wherever the shared Source Optimize Contract page is available.
- Specific clients: None. Position depends only on governed state, never on tenant, vendor, or contract
  identity, and never on a hardcoded index.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/contract-optimization-workflow-step.ts` (new)
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts` (new)
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- Pass: `npx jest` on both suites — 20 tests, including 10 new position cases and a page case proving
  the rail holds at the evidence step (rather than a fixed step 2) when required evidence is missing
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`

Rail labels now use the 7-step vocabulary from the module spec (Select contract, Lock baseline, Read
evidence, Diagnose opportunity, Build strategy, Approve and execute, Prove value). The step-1 action
wording was deliberately kept distinct from the contract picker's heading so the same sentence does not
appear twice on one screen.

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
- Live signed-in proof required: Yes — the rail must sit on the step the case has actually reached, and
  the next-decision bar must name the action and blocker.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Presentation and derived view-model only; rollback carries no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in browser proof of the rail state and next-decision bar after deploy.

## Known Gaps

- Steps 5 and 6 read the opportunity maturity stage (`target_position`, `agreed`). There is no separate
  persisted strategy packet or approval record for Optimize Contract yet, so those steps advance on
  opportunity stage alone. Building the strategy and approval artifacts is separate work.
- The rail is a horizontal chip row, not the left tree with substeps described in the module spec. The
  tree layout is deliberately deferred so this change stays reviewable.
- This does not address the equivalent positional-completion issue on the New Event journey rail, which
  is tracked separately.
