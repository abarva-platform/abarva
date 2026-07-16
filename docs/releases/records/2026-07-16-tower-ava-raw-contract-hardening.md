# 2026-07-16-tower-ava-raw-contract-hardening — Tower aVa Raw Contract Hardening

## Release ID

`2026-07-16-tower-ava-raw-contract-hardening`

## Status

`candidate`

## Plain-English Summary

Tower aVa now has a tighter raw answer contract so normal Claude output is less likely to truncate into malformed JSON, and malformed output still falls back to a board-ready CIO/CFO advisory answer. This does not change Tower data sourcing or the Meridian v3-derived runtime cutover.

## Layer Impact

- Release lane: `global-control-lane`.
- Tower answer layer: hardens the Tower aVa prompt, parser, and deterministic fallback quality.
- Tower runtime data layer: no change. TowerContextPack and v3-derived projection behavior are unchanged.
- User experience: fallback answers now preserve executive-quality guidance instead of thin safety prose.

## Client Applicability

- All clients: Tower aVa prompt/parser/fallback behavior applies wherever Tower aVa is available.
- Specific clients: Meridian / Healthcare Demo receives the immediate demo-quality benefit because the live proof identified malformed raw Tower output there.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/lib/cio-tower/answer.ts`
- `src/lib/cio-tower/__tests__/answer.test.ts`
- Follow-up hardening after live proof: refined internal-ID detection to avoid false positives on normal prose, allowed complete larger tables instead of forcing fallback, and strengthened prompt language to avoid the phrase `realized value` when claim gates do not allow it.

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Pass: live Meridian proof identified follow-up fixes before final acceptance.
- Pending: Tower lineage/runtime audits before merge.
- Pending: release check before PR.
- Pending: signed-in Meridian Tower proof after merge/deploy.

## Rollout Plan

Merge through the protected PR lane. The repo-owned Azure Container Apps main deploy workflow will build and deploy the new image. After deploy, run signed-in Meridian Tower aVa proof and confirm the answer is board-ready, v3-postured, and free of raw contract leakage or unsupported outcome claims.

## Deployment Authority

- Repo-owned deploy workflow: required for production/lab activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be captured after ACA main deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR or roll ACA traffic back to the previous healthy digest-pinned revision. No migrations or data changes are included.

## Audit Evidence

- PR URL: pending.
- Focused test output: local Jest pass for Tower answer contract hardening.
- Live proof: pending after deploy.

## Known Gaps

This PR does not change Tower data sourcing, Tower tabs, v3 TowerContextPack derivation, or the Meridian runtime cutover. It hardens the aVa answer contract and fallback quality only.
