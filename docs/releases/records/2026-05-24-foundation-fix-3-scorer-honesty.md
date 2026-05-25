# 2026-05-24-foundation-fix-3-scorer-honesty — Audit Scorer Honesty

## Release ID

`2026-05-24-foundation-fix-3-scorer-honesty`

## Status

`candidate`

## Plain-English Summary

The agent audit scorer now penalizes responses that previously looked better than they were: canned fallback prose, raw payload captures, explicit data-unavailable admissions, session-memory admissions, repeated templates, and prose/action mismatches. The existing Apex and Meridian reports were re-scored with the corrected rubric so the headline numbers reflect the real defects found by the crawl.

## Layer Impact

`quality-lane`: Hardens the audit runner and report renderer so QA scores are honest and reproducible.

`audit-artifact-lane`: Adds corrected Apex and Meridian audit reports plus transcript provenance for the scorer-honesty baseline.

## Client Applicability

- All clients: no runtime product behavior changes.
- Specific clients: Apex Retail Group and Meridian Health corrected audit artifacts.
- Internal only: yes, audit tooling and reports.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Scorer and renderer: `scripts/audit/run-agent-2task-eval.ts`
- Smoke: `scripts/smoke/foundation-fix-3-scorer-honesty.spec.ts`
- Corrected Apex report: `audit-artifacts/apex-2task-eval-2026-05-24-17-39-opA/APEX_AGENT_INTELLIGENCE_REPORT.CORRECTED.html`
- Corrected Meridian report: `audit-artifacts/meridian-2task-eval-2026-05-24-17-39-opB/MERIDIAN_AGENT_INTELLIGENCE_REPORT.CORRECTED.html`

## QA / Validation

- `npx tsx scripts/smoke/foundation-fix-3-scorer-honesty.spec.ts` — passed.
- `npx tsx scripts/audit/run-agent-2task-eval.ts --rescore-existing` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to main. This is an internal audit tooling change and corrected-artifact publish; no production deploy is required for customer-facing behavior, though the app deployment can proceed with the branch if bundled in the normal release train.

## Rollback Plan

Revert this PR to restore the previous scorer behavior and remove the corrected report artifacts. No database rollback is required.

## Audit Evidence

The corrected reports show Apex `7.1 -> 4.2` and Meridian `7.7 -> 4.4`, with detector badges on affected turns and `UNSCORED` capture-defect handling.

## Known Gaps

This packet flags payload-capture defects but does not fix the crawl capture pipeline itself.
