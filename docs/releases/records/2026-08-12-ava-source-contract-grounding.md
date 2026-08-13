# 2026-08-12-ava-source-contract-grounding — aVa Source Contract Grounding

## Release ID

`2026-08-12-ava-source-contract-grounding`

## Status

`candidate`

## Plain-English Summary

aVa could not answer questions about the contract the user was looking at. On the Optimize Contract
page, every contract-grain question — which evidence is missing, is the baseline locked, what is the
SLA credit opportunity, what value is reproducible — came back with an empty context bundle, and aVa
told the user to go look at Contract 360 while they were already on the page displaying the answer.

Two causes, both fixed here. The page sends `surfaceContext.contractId` and nothing read it. And the
portfolio grounding block deliberately instructs aVa to deflect single-contract questions to Contract
360, which is correct when there is no contract detail to offer and wrong once the surface carries one.

aVa now receives a contract grounding block built from the same governed reads the Optimize Contract
page renders from — baseline status, workflow position and blocker, evidence readiness with the missing
families named, opportunity rows with their trace state, the reproducible versus non-reproducible split,
and finance-confirmed value — and that block cancels the deflection for the contract in scope.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source aVa answer path on contract-carrying Source surfaces.
- Canonical model: No canonical data, adapter, migration, or calculation changed. The grounding module
  calls existing read-adapter functions and existing pure builders; it re-implements no calculation, so
  aVa's numbers cannot diverge from the page.

## Client Applicability

- All clients: Yes, on any Source surface that carries a contract id.
- Specific clients: None. Grounding is keyed off the contract id on the surface and the active tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. The block is empty when no contract id is present, so every other turn is
  unchanged.

## Changes Included

- `src/lib/source/facts/view/ava-contract-grounding-context.ts` (new)
- `src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts` (new)
- `src/app/api/chat/agent/route.ts` — reads `surfaceContext.contractId`, injects the block after the
  portfolio block, and extends the quote-not-compute guard and generic-context suppression to it

## QA / Validation

- Pass: `npx jest src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts` — 8 tests
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- `npx jest src/app/api/chat/agent` — 53 pass, 6 fail. Those 6 fail identically on `origin/main` with
  these changes stashed; they are pre-existing and untouched here.

Governance behaviour covered by tests: an unknown contract returns no block rather than a guess; a read
failure returns no block rather than breaking the turn; missing evidence families are named as missing;
reproducible and non-reproducible value are stated separately; realized value comes only from finance
confirmation; and a conflicted annual value quotes the resolved value with the conflict disclosed.

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
- Live signed-in proof required: Yes — a contract-grain question asked on the Optimize Contract surface
  must be answered from governed numbers matching the page, not deflected to Contract 360.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. The grounding block is additive; reverting restores the previous deflection behaviour
with no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in aVa transcript on the Optimize Contract surface after deploy.
- Probe that motivated this: `docs/testing/source-ava-hard-qa-2026-08-12.md` (AVA-S-01).

## Known Gaps

- AVA-S-02 is not addressed: aVa's portfolio grounding reports a different contract and vendor count
  than the Source workspace header for the same tenant. That needs reconciling against the governed
  source before either figure is quoted, and is a read-model question rather than a grounding one.
- AVA-S-03 (financial values redacted in aVa while displayed on the tenant's own surfaces) is a
  governance-flag question and is not addressed here.
- The remaining questions of the 25 + 25 aVa set should be re-run now that contract grounding exists.
