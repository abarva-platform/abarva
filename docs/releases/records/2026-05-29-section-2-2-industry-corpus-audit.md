# 2026-05-29-section-2-2-industry-corpus-audit — Corpus Audit

## Release ID

`2026-05-29-section-2-2-industry-corpus-audit`

## Status

`candidate`

## Plain-English Summary

This release publishes the Section 2.2 industry corpus audit. The audit confirms that the target corpus schema exists but is not populated: `corpus_patterns`, `client_private_patterns`, `framework_overlays`, and `corpus_overlays` all have zero rows. The legacy `canonical_industry_ai_patterns` table still contains 312 rows and must be migrated before Packet 35 Phase 2 authoring starts.

## Layer Impact

Control/audit lane only. No runtime code or database data changes.

## Client Applicability

- All clients: identifies the shared corpus storage gap affecting tenant-facing retrieval.
- Specific clients: Apex, Meridian, Northstar, First Capital, and SkyHarbor row counts are included.
- Internal only: audit artifact.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/audits/INDUSTRY_CORPUS_AUDIT_2026-05-29.md`

## QA / Validation

- PASS: read-only Supabase service-role audit via PostgREST.
- PASS: static retrieval-path grep after PR #2420.
- PASS: `git diff --check`.

## Rollout Plan

Merge after CI is green. This is documentation/audit-only and does not require deploy validation beyond normal checks.

## Rollback Plan

Revert this PR to remove the audit artifact. No runtime or data rollback required.

## Audit Evidence

- `docs/architecture/audits/INDUSTRY_CORPUS_AUDIT_2026-05-29.md`
- Table counts captured on 2026-05-29.
- Retrieval-path grep captured on `origin/main` after PR #2420.

## Known Gaps

The audit deliberately leaves Packet 35 Phase 2 blocked until the 312 legacy structured rows and 21 remaining pattern-pack rows migrate into `corpus_patterns` / `client_private_patterns` and retrieval returns scoped matches.
