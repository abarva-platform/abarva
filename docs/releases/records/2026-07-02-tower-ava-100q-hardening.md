# 2026-07-02-tower-ava-100q-hardening — Tower aVa 100Q Routing Hardening

## Release ID

`2026-07-02-tower-ava-100q-hardening`

## Status

`candidate`

## Plain-English Summary

This release hardens the Tower aVa answer path after the 100-question live audit showed that Tower was no longer failing broadly, but still misrouted specific deterministic CIO/CFO questions. The fix routes run/change, trend, status, vendor, contract, evidence, trust, value, and AI-program prompts into explicit governed Tower answer contracts instead of letting them fall through to a generic or wrong top-program answer.

## Layer Impact

- `global-control-lane`: Changes shared Tower answer routing and deterministic answer behavior for all tenants using the governed Tower aVa path.
- `client-data-lane`: No schema, migration, ingestion, or tenant data changes are included.

## Client Applicability

- All clients: Yes, for the Tower aVa governed answer path.
- Specific clients: Not tenant-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Expands Tower supported-question routing in `src/lib/atlas/tower-factual-spine.ts`.
- Expands governed Tower answer contract matching in `src/lib/cio-tower/answer.ts`.
- Adds deterministic gap/readout responses for vendor/contract and evidence/trust question families.
- Changes unmatched governed Tower questions to an evidence/trust response instead of defaulting to top-program ranking.
- Adds regression coverage in `src/lib/cio-tower/__tests__/answer.test.ts` and `src/lib/atlas/__tests__/tower-factual-spine.test.ts`.

## QA / Validation

- `npx eslint src/lib/cio-tower/answer.ts src/lib/atlas/tower-factual-spine.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts` — passed.
- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts --runInBand` — passed, 39 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact main SHA image, then rerun the signed-in Tower 100-question audit against `https://app.abarva.ai/tower`.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: No manual ACA runtime mutation in this release record.
- Approved image digest: To be captured after main deploy.
- ACA runtime invariant: Active revision, template image, and 100% traffic must match the approved main image.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, rerun the 50x2 Tower aVa audit and compare against the 78/100 baseline.

## Rollback Plan

Revert this PR and redeploy the prior approved main image through the repo-owned ACA deploy workflow. No data rollback is needed because this release does not change schema or tenant data.

## Audit Evidence

- Baseline live audit before this release: 78/100 non-empty, 22 failures, P95 21.8s.
- Candidate validation: targeted ESLint, targeted Jest, and full TypeScript listed above.
- Post-deploy evidence pending: ACA revision/digest plus signed-in 100Q audit report.

## Known Gaps

This candidate is not deployed or browser-proven yet. The release only hardens the deterministic routing/contract layer; it does not redesign Tower dashboard UX or add new Tower source data.
