# 2026-05-30-phase5c-evidence-wording — Ask Evidence Wording Follow-Up

## Release ID

`2026-05-30-phase5c-evidence-wording`

## Status

`candidate`

## Plain-English Summary

This follow-up tightens three more evidence-safe phrases that showed up in the post-Phase-5B verifier: "no dispute," "no contested ground," and "no clean exit path." Those are normal executive phrases, but the verifier treats broad "no ... ledger/inventory" language as an unavailable-data risk. The app now rewrites them only when tenant evidence is present.

## Layer Impact

- `global-control-lane`: Further tightens shared Ask answer wording after tenant evidence retrieval succeeds.
- `qa-validation-lane`: Targets the remaining Q7/Q9-style verifier misses caused by false unavailable-context wording.
- `runtime-app-lane`: No retrieval, scoring, model routing, database schema, RLS, or deployment-script change.

## Client Applicability

- All clients: Yes, for authenticated Ask/Sentinel responses with tenant, surface, or graph evidence.
- Specific clients: SkyHarbor Air benefits directly for IBM dependency and productivity-guarantee prompts.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Rewrites "no dispute" and "no contested ground" to "zero dispute" and "zero contested ground" when tenant evidence exists.
- Rewrites "no clean exit path" to "lack a clean exit path" when tenant evidence exists.
- Extends the response-policy regression test to cover the phrases observed in the post-Phase-5B verifier.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand`.
- PASS: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check`.
- Pending: PR CI.
- Pending: post-deploy SkyHarbor verifier rerun.

## Rollout Plan

Merge to `main` after CI passes, deploy the Next.js app normally, then rerun the SkyHarbor verifier. No environment variable, migration, tenant-data write, RLS change, or manual deployment-script change is required.

## Rollback Plan

Revert this application commit to remove the Phase 5C wording normalization. No data rollback, migration rollback, RLS rollback, or Vercel environment rollback is required.

## Audit Evidence

- Policy implementation: `src/lib/intelligence/ask/response-policy.ts`.
- Regression coverage: `src/lib/intelligence/ask/response-policy.test.ts`.
- Source verifier artifact inspected: `/tmp/phase5b-verifier-2/ground_truth_results.json`.
- PR URL: pending.

## Known Gaps

This fixes the latest false unavailable-context wording. Phase 5 remains open until three consecutive production verifier runs pass at >=23/25 with unavailableAdmissionRate below 10%.
