# 2026-06-29-home-v6-quality-hardening - Home V6 Quality Hardening

## Release ID

`2026-06-29-home-v6-quality-hardening`

## Status

`candidate`

## Plain-English Summary

Home answer QA now treats money, value, cost, adoption, and AI-usage claims as a stricter evidence class. The V6 projection audit no longer lets a generally populated file look safe when the specific dollar, value-basis, period, ownership, adoption, or readiness fields are missing. A new V6 critical-gap report audits every tenant file and names the exact files and columns that must be fixed before Home can be called broadly demo-ready for factual answers.

## Layer Impact

- `internal-admin`: Adds stronger internal QA tooling for V6 data-readiness and Home answer-correctness projection.
- `client-data-lane`: Produces evidence about tenant V6 data gaps, but does not change or load client data.
- `global-control-lane`: No runtime behavior changes in this slice.

## Client Applicability

- All clients: The QA scripts can audit all V6 demo tenants using the shared V6 template contract.
- Specific clients: Reports highlight SkyHarbor/Airline Demo and Lakeshore/Industrial Demo as current priority remediation tenants.
- Internal only: Yes, this is an internal QA/data-readiness slice.
- Public/demo only: No public UI change.
- Feature flag: None.

## Changes Included

- `scripts/qa/home-v6-backend-correctness-projection.mjs`
  - Adds strict money/value/adoption readiness scoring.
  - Reports strict failure and caveat-required counts.
- `scripts/qa/home-v6-critical-gap-report.mjs`
  - New file-by-file V6 gap reporter across all demo tenants.
  - Emits JSON, CSV, and Markdown outputs with priority file fixes and missing columns.

## QA / Validation

- `node --check scripts/qa/home-v6-backend-correctness-projection.mjs` passed.
- `node --check scripts/qa/home-v6-critical-gap-report.mjs` passed.
- Strict projection run against current V6 directories produced:
  - 1000 projected questions.
  - 87.8% projected pass rate.
  - 7.9% decision-ready projected rate.
  - 122 low-score projected questions.
  - 36 strict money/value/adoption failures.
  - 150 strict money/value/adoption caveat-required questions.
- V6 critical gap report produced:
  - 80 files audited.
  - 18 high-risk files.
  - 21 medium-risk files.
  - 15 files not ready for money/value/adoption claims.

## Rollout Plan

Merge the QA tooling to `main`. No Azure Container Apps runtime rollout is required for the tooling itself unless a later runtime or UI change depends on these scripts.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this internal QA-only slice.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this QA-only slice; later runtime/data fixes must run live Home answer QA.

## Rollback Plan

Revert the script and release-record changes if the scoring is too strict or blocks unrelated QA usage. No database, client data, runtime, or migration rollback is required.

## Audit Evidence

- `/Users/anand/Projects/nexus/reports/home-v6-backend-correctness-projection-strict-2026-06-29/`
- `/Users/anand/Projects/nexus/reports/home-v6-critical-gap-report-2026-06-29/`

## Known Gaps

- This slice does not edit the V6 files.
- This slice does not load revised V6 data into Azure.
- This slice does not prove live signed-in browser answers after data remediation.
