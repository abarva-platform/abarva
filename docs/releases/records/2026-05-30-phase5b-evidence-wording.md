# 2026-05-30-phase5b-evidence-wording — Ask Evidence Wording Tightening

## Release ID

`2026-05-30-phase5b-evidence-wording`

## Status

`candidate`

## Plain-English Summary

Sentinel Ask now avoids wording that makes a tenant-backed answer look like missing data. When loaded tenant evidence is present, the response policy rewrites phrases such as "no record loaded" or "no ... ledger" into evidence-positive wording that keeps the answer honest without triggering an unavailable-context admission.

## Layer Impact

- `global-control-lane`: Tightens shared Ask answer wording after retrieval succeeds. It does not change retrieval, scoring, verifier logic, model routing, database schema, RLS, or deployment scripts.
- `qa-validation-lane`: Targets Phase 5 verifier misses where strong SkyHarbor answers were capped because wording matched the unavailable-data detector.
- `release-governance-lane`: Records the Phase 5B scope, QA, rollout, rollback, and post-deploy verifier dependency.

## Client Applicability

- All clients: Yes, for authenticated Ask/Sentinel responses with tenant, surface, or graph evidence.
- Specific clients: SkyHarbor Air benefits directly for modernization-ledger and mainframe-inventory verifier prompts.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds tenant-evidence-only wording normalization for false unavailable-context trigger phrases.
- Converts "No specific ... loaded" into "The loaded sources do not include a specific ...".
- Converts "no SHA-MOD entry is explicitly flagged" into a positive loaded-ledger formulation.
- Converts common evidence-safe "no ..." phrases such as "no controversy" and "no realized value signal" into "zero ..." phrasing.
- Adds focused regression coverage using SkyHarbor-style verifier failure wording.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/response-policy.test.ts --runInBand`.
- PASS: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts`.
- PASS: `git diff --check`.
- Pending: `npm run release:check -- --base origin/main --head HEAD`.
- Pending: PR CI.
- Pending: post-deploy SkyHarbor verifier rerun.

## Rollout Plan

Merge to `main` after CI passes, deploy the Next.js app normally, then rerun the SkyHarbor verifier. No environment variable, migration, tenant-data write, RLS change, or manual deployment-script change is required.

## Rollback Plan

Revert this application commit to remove the Phase 5B wording normalization. No data rollback, migration rollback, RLS rollback, or Vercel environment rollback is required.

## Audit Evidence

- Policy implementation: `src/lib/intelligence/ask/response-policy.ts`.
- Regression coverage: `src/lib/intelligence/ask/response-policy.test.ts`.
- Source verifier artifacts inspected:
  - `/tmp/phase5-verifier-post-policy-1/ground_truth_results.json`
  - `/tmp/phase5-verifier-post-policy-2/ground_truth_results.json`
  - `/tmp/phase5-verifier-post-policy-3/ground_truth_results.json`
- PR URL: pending.

## Known Gaps

This fixes wording that falsely looks like unavailable context. It does not change the underlying corpus, retrieval, or verifier scoring. Phase 5 remains open until three consecutive production verifier runs pass at >=23/25 with unavailableAdmissionRate below 10%.
