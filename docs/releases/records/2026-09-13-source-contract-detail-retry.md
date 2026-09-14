# 2026-09-13-source-contract-detail-retry — A failed attempt is not a verdict

## Release ID

`2026-09-13-source-contract-detail-retry`

## Status

`candidate`

## Plain-English Summary

Opening a contract by direct link could show "Contract detail unavailable" when
the contract was perfectly fine. Opening the same contract from the register a
moment later worked. Two faults in one function produced that.

The guard treated any stored entry as already handled, and a failed request
stored `"error"` — so once a contract failed, no later caller could request it
again. Meanwhile the fetch below the guard ran whether or not the guard had
allowed the attempt, so a repeat call still reached the network and quietly
overwrote the error when it succeeded. That is why the failure looked transient:
it was only ever cleared by the reader happening to click the same contract
again.

A cold request can fail once and succeed immediately after. The surface now
retries a bounded number of times before saying anything, so a single cold
start no longer produces a definitive claim — the panel states "Source could not
load this contract. No substitute contract is being shown", which should be
true when it appears. If every attempt fails, the contract is released from the
request ledger so a later open tries afresh rather than meeting a stored
verdict.

The ledger is a ref rather than state, because the decision to send a request
has to be made synchronously at call time.

## Layer Impact

- **Release lane:** `global-control-lane` — shared workspace client behaviour for all clients, not feature-gated.
- **Layer 4 / Products:** Contract-detail request lifecycle in the workspace client.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. The same endpoint is called with the same arguments.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every deep link into a contract.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `WorkspaceClient.tsx`: request ledger held in a ref; bounded retry before an error is recorded; the contract released after the attempts are spent.
- `contractDetailRetry.test.tsx`: five assertions covering the synchronous decision, the removed latch, the retry, the release, and the loaded marker.
- `workspace-explicit-client-api-routing.test.ts`: the client-routing assertion now matches the call's arguments rather than one formatting of the line.

## QA / Validation

- Focused Jest: 29 suites, 253 tests passed across the workspace slice.
- **Mutation-tested both guards.** Keeping the ledger entry after a failure fails one test; removing the retry fails another.
- Repository TypeScript: clean. ESLint on all three changed files: clean.

### An earlier version of this fix stopped fetching entirely

That version kept the decision inside a state updater and read a flag it
set. A state updater is not guaranteed to run before the calling function
returns, so the flag was still false and **no request was ever sent**. Two
existing behavioural tests in the ECL browser suite caught it immediately —
they mount the real client and look for contract content, and found none.

Worth recording because the structural tests in this change would not have
caught it on their own. The ledger is a ref for exactly this reason.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deploy workflow
builds a digest-pinned image and updates the shared lab runtime. No migration or
operator data-build job is required.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None outside the workflow.
- **Approved image digest:** Recorded after deployment.
- **ACA runtime invariant:** Required before calling the change live-proven.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** Yes — open a contract by direct link in a fresh session and confirm it hydrates without showing the unavailable panel.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, mutation-test results, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and a signed-in deep-link read.

## Known Gaps

Two attempts and a short delay are a judgement about how long a cold request
takes, not a measurement. If deep links still fail after this, the delay is the
thing to tune, and the failing status code should be captured rather than
discarded — the catch currently treats every failure the same, so a genuine 404
retries as patiently as a transient 503.

The failure panel still has no retry control. A reader who meets it must open
the contract again; the release makes that work, but the surface does not say
so.
