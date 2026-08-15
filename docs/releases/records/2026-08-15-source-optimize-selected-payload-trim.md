# 2026-08-15-source-optimize-selected-payload-trim — Source Optimize Selected-Page Payload Trim

## Release ID

`2026-08-15-source-optimize-selected-payload-trim`

## Status

`live-proven`

## Plain-English Summary

The selected-contract Optimize page keeps the same visible workflow and evidence behavior, but no longer sends the full ranked contract list inside the selected-contract client payload. The portfolio picker still receives ranked candidates when no contract is selected.

## Layer Impact

- `global-control-lane`: Source Optimize Contract selected-contract route receives a smaller client payload.
- Products: Source Optimize Contract page behavior is unchanged; selected pages stop carrying unused full-candidate payload data.
- Canonical Model: No canonical data, calculation, evidence, or entitlement rule changes.

## Client Applicability

- All clients: Yes, for the shared Source Optimize Contract product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/contract-optimization-spine.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts --runInBand`.
- Pass: `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand`.
- Pass: `npx eslint src/lib/source/data-model/contract-optimization-spine.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts docs/releases/records/2026-08-15-source-optimize-selected-payload-trim.md` with one expected ignored-file warning for the Markdown release record.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Live signed-in browser proof after ACA deployment: selected-contract Optimize rendered with `Selected opportunity: Negotiated improvement`, Step 7, and a 163 KB HTML payload; reverse handoff to Contract 360 preserved `CTR-090`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the digest-pinned web image. No migration or data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:49cbbda5bfeebcbc64c2d50f2b992de784620933c7c2d9aa64a9b4186b842228`.
- ACA runtime invariant: proven on `ca-abarva-web-lab-eastus--m36cd2c7f` with 100% traffic.
- Worker image invariant: delivery worker jobs matched the same approved digest; historical jobs are outside this release proof.
- Feature/env flag update path: None.
- Live signed-in proof required: completed for selected Optimize route and Contract 360 handoff. aVa grounding remains covered by its own release records and is not claimed here.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. This is a presentation/payload change only, with no schema or data rollback.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6359
- Merge commit: `8dc5e2c564f3c512c2a6873ed0c077150fad21f4`
- ACA deployment run: `31886533505`
- Runtime revision: `ca-abarva-web-lab-eastus--m36cd2c7f`
- Signed-in browser proof: selected Optimize route rendered 163 KB HTML / 635 DOM nodes; Contract 360 reverse handoff rendered `CTR-090`, `Salesforce Data Platform Agreement 3`, and `Open optimize plan`.

## Known Gaps

This does not redesign Optimize workflow semantics or alter evidence gates. It only removes unused selected-page candidate serialization.
