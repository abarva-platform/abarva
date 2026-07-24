# 2026-07-24-tower-all-active-budget-envelope-repair — Tower Active Budget Envelope Repair

## Release ID

`2026-07-24-tower-all-active-budget-envelope-repair`

## Status

`candidate`

## Plain-English Summary

Tower Command Center previously rendered correct Meridian budget values after the active-source repair, but the other active demo tenants still had blocking FY26 IT budget gaps in their active input packs. This release adds explicit source-backed budget-envelope rows for those tenants so Tower mart generation can project non-zero spend posture values from active tenant inputs instead of falling back to zero.

## Layer Impact

Release lane: `client-data-lane`

Layer 1 / Client Intake: Adds repaired source rows to active synthetic-demo tenant input packets under `datasets/tenant-inputs/active/*/current/08_spend_value.csv`.

Layer 2 / Source Adapters: Adds a reproducible repair/audit script that rolls up declared F12 budget extracts or declared profile budget fields into the active universal spend template.

Layer 3 / Canonical Model: No schema change. The Tower mart projection continues to build facts from active tenant input packets.

Layer 4 / Products: No UI code change. Tower values change only after the governed ACA operator job regenerates mart rows for each tenant.

## Client Applicability

- All clients: No.
- Specific clients: Apex Retail, FS Demo, Lakeshore Holdings, Lakeshore Industries, Airline Demo.
- Internal only: No.
- Public/demo only: Synthetic demo tenants only.
- Feature flag: Existing Tower route flags are unchanged.

## Changes Included

- `scripts/tower/repair-active-budget-envelopes.mjs`
- `datasets/tenant-inputs/active/*/current/08_spend_value.csv` budget repair rows for non-Meridian active demo tenants.
- `package.json` tenant-specific Tower mart dry-run/write scripts for Apex Retail and Lakeshore tenants.
- `scripts/tower/audit-tower-mart-data-loading-qa.mjs` widened from three tenants to all six active tenants.

## QA / Validation

Required before merge:

- PASS: `npm run audit:tower-active-budget-envelopes`
- PASS: `npm run audit:tower-data-path-fix`
- PASS: `npm run audit:tower-mart-data-loading-qa`
- PASS: `npm run audit:enterprise-naming`
- PASS: `npm run audit:architecture-rules`
- PASS: targeted Tower tenant identity tests
- PASS: `npm run release:check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS: `git diff --check`

Required after merge/deploy:

- PENDING: Run tenant-specific `project:tower-mart:*:write-job` scripts through the governed ACA operator job using the digest-pinned main image.
- PENDING: Verify ACA runtime invariant.
- PENDING: Run signed-in Tower browser proof for each authenticated demo tenant where a stored Clerk state exists.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then run the governed ACA operator job per tenant to refresh Tower mart rows. Do not claim signed-in live proof until browser checks are captured after the writes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Merge to main deploy workflow and governed ACA operator jobs only.
- Approved image digest: To be recorded after merge/deploy.
- ACA runtime invariant: Must be checked after deploy before claiming runtime.
- Worker image invariant: Operator jobs must run the same approved digest-pinned image.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after mart writes.

## Rollback Plan

Revert the release commit and redeploy through ACA main. For already-written marts, rerun the previous known-good tenant mart write job or restore using the transaction/proof bundle emitted by the governed operator job.

## Audit Evidence

- `reports/tower-active-budget-envelope-repair/summary.md`
- `reports/tower-active-budget-envelope-repair/budget-envelope-repair.csv`
- `reports/tower-active-budget-envelope-repair/proof.html`
- `reports/tower-data-fix/fact-lineage/tower-command-metric-lineage.csv`
- `reports/tower-mart-data-loading-qa/summary.md`

## Known Gaps

Lakeshore Holdings has a declared direct IT budget total in its active enterprise profile, but no source-declared run/change split. The repair carries the source-backed total and records the split as pending; the current projection uses its explicit unsplit fallback until a finance extract is supplied.
