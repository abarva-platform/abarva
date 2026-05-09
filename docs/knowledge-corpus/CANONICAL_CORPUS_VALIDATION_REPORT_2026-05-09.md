# Canonical Corpus Validation Report - 2026-05-09

Generated at: `2026-05-09T23:01:00.609Z`

Input: `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json`

Mode: report-only

## Summary

- Patterns validated: 312
- Error issues: 0
- Warning issues: 0
- Patterns with errors: 0
- Patterns with warnings: 0
- DB/backfill status: DB credentials were unavailable or query failed; DB-backed pattern rows were skipped.

## Phase Coverage

| Strategic Move phase | Pattern count |
| --- | --- |
| originate | 93 |
| charter | 301 |
| diagnose_discover | 305 |
| design | 307 |
| roadmap_business_case_change_value_plan | 307 |
| mobilize_handoff | 108 |

## Source System Counts

| Source system | Pattern count |
| --- | --- |
| generated_pattern_manifest | 17 |
| pattern_seed | 306 |

## Issue Summary

No validation issues detected.

## Sample Issues

No sample issues.

## Gate Notes

- The validator is intentionally report-only by default while the current corpus still contains known Wave 1 and Wave 2 gaps.
- Use `--strict` to make any error fail the command once Wave 3 content remediation is expected to satisfy the quality gates.
- This script does not insert, update, delete, or mutate database content.
