# 2026-08-01-foundation-v3-source-expectation-correction — Source Expectation Correction

## Release ID

`2026-08-01-foundation-v3-source-expectation-correction`

## Status

`candidate`

## Plain-English Summary

Corrects the Foundation V3 source-register expectation from an operational-file
snapshot to an authored intake data-source count. The corrected expectation is
33 declared intake data sources: 26 registered tabular data sources, 3 known
unregistered tabular support sources, and 4 declared absent sources. Five
workbook companions are lineage artifacts for drill-through and are excluded
from the data-source count.

Parser-visible row expectation remains unchanged at 6,362 because that value is
derived from source row counts.

## Layer Impact

- `client-data-lane`: updates the isolated synthetic lab lane's expectation
  ledger for source registration.
- Layer 1 intake expectations: corrects the authored source count that will be
  replaced by `intake.expected_source` when that relation lands.
- Operations / QA readback: updates offline and live reports so conservation
  gates compare registered sources to authored data-source expectations, not
  operational files.

## Client Applicability

- All clients: no.
- Specific clients: isolated synthetic lab lane only.
- Internal only: yes, for Foundation V3 QA and operator evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/build-foundation-v3-day-one-breach-report.mjs`
- `scripts/qa/skyharbor-day-one-breach-readback.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- `supabase/migrations/20260801231000_foundation_v3_source_expectation_correction.sql`
- `docs/releases/records/2026-08-01-foundation-v3-source-expectation-correction.md`

## QA / Validation

Local validation before PR:

- pass: `node --check scripts/knowledge/build-foundation-v3-day-one-breach-report.mjs`
- pass: `node --check scripts/qa/skyharbor-day-one-breach-readback.mjs`
- pass: `git diff --check`
- pass: restricted-token added-line scan
- pass: `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

Planned after deploy:

- Apply `20260801231000_foundation_v3_source_expectation_correction.sql`
  through the isolated private operator job.
- Rerun `qa:skair-day-one-breach-readback` and verify
  `exp-source-register-file-count-v1` reports expected 33, actual 26.

## Rollout Plan

Merge through PR. Let the repo-owned ACA main deploy workflow publish the
corrected image. Apply the single forced migration through the isolated private
operator job, then rerun the day-one readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no ad-hoc shared web runtime mutation.
- Approved image digest: to be captured from ACA after merge/deploy.
- ACA runtime invariant: must pass before operator execution.
- Worker image invariant: governed deploy updates worker jobs to the same image.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is a QA/ledger correction, not a UI
  feature.

## Rollback Plan

Revert the PR and apply a follow-up correction migration if the live expectation
ledger has already been updated. This release does not mutate source, evidence,
working, canonical, publication, consumption, Cube, or UI data.

## Audit Evidence

Before merge:

- Local command outputs listed in QA / Validation.
- PR URL and CI run to be added by GitHub.

After deploy:

- ACA deploy run URL.
- Single-migration dry-run and apply operator output folders.
- Post-apply day-one readback output folder and proof bundle.

## Known Gaps

This does not register the three missing tabular support sources. It does not
create `intake.expected_source`. It does not change parser-visible row
expectations, promote canonical records, rebuild projections, activate a
baseline, or prove product/browser consumption.
