# 2026-05-28-skyharbor-semantic-retrieval-gate — SkyHarbor Semantic Retrieval and Tier-1 Verifier

## Release ID

`2026-05-28-skyharbor-semantic-retrieval-gate`

## Status

`candidate`

## Plain-English Summary

This release tightens the SkyHarbor demo readiness path after the semantic retrieval probe showed that a CTO question about IBM dependency and Amala's pressure was domain-correct but too shallow on visible source grounding. It adds SkyHarbor tenant aliases to the enterprise-context retriever, routes IBM/mainframe/AWS/Amala/value-ledger language to the correct data segments, and replaces the placeholder Tier-1 ground-truth runner with a real authenticated production replay.

## Layer Impact

- app-control-lane: no visible UI changes; this affects the server-side context selected for Intelligence answers.
- client-data-lane: SkyHarbor tenant keys now resolve through the same structured-fact path as other tenants.
- corpus-knowledge-lane: airline modernization terms route to enterprise profile, org structure, IT financials, IT landscape, and program inventory context instead of falling through to a shallow answer.
- ops-release-lane: the documented Packet 29 command now runs a real verifier and penalizes data-unavailable admissions.

## Client Applicability

- All clients: no broad behavior change intended.
- Specific clients: SkyHarbor Air semantic retrieval and demo verification.
- Internal only: verifier artifact generation under `scripts/skyharbor`.
- Public/demo only: Delta/SkyHarbor demo readiness.
- Feature flag: not applicable.

## Changes Included

- `src/lib/knowledge/tenant-enterprise-context.ts` adds SkyHarbor aliases and airline modernization routing terms.
- `scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs` now authenticates as a SkyHarbor persona, calls production `/api/intelligence/ask`, scores 25 CTO questions, writes JSON/Markdown evidence, and caps scores for data-unavailable admissions.
- `scripts/skyharbor/07_verify/ground_truth_runner.mjs` preserves the Packet 29 documented command path as a wrapper.

## QA / Validation

Passed locally:

```text
npx jest src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts --runInBand
npx eslint src/lib/knowledge/tenant-enterprise-context.ts scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs scripts/skyharbor/07_verify/ground_truth_runner.mjs
npx tsc --noEmit --pretty false
git diff --check
```

Pre-fix production semantic probe returned HTTP 200 with no wrong-tenant leakage, but it did not visibly cite the S06 IBM engagement segment and therefore was not strong enough for the CTO demo gate. The post-fix semantic probe and full Tier-1 replay must be rerun after deployment.

## Rollout Plan

Merge to main, deploy to Vercel production, rerun the exact semantic retrieval question, then run the Packet 29 Tier-1 verifier from the documented command path.

## Rollback Plan

Revert this release if SkyHarbor retrieval regresses other tenant routing or if the verifier blocks on authentication unexpectedly. The verifier is script-only and has no runtime effect; the retriever changes are limited to routing and tenant-key resolution.

## Audit Evidence

- Pre-fix semantic probe: production answered the IBM/Amala through-line question with 6 sources and no tenant leak, but missed visible S06 grounding.
- Focused retrieval test: `19/19` tests passed.
- Typecheck and lint passed.

## Known Gaps

The full 25-question replay must be rerun after this release is live. The shell session still receives an invalid `GH_TOKEN` from the Codex app environment; standard shell rc files did not contain the bad export, and `gh` keychain auth works when `GH_TOKEN` is unset.
