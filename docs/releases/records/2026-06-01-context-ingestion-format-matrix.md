# 2026-06-01-context-ingestion-format-matrix — Context Ingestion Format Matrix

## Release ID

`2026-06-01-context-ingestion-format-matrix`

## Status

`candidate`

## Plain-English Summary

Amends ADR-0008 with an explicit pilot format matrix for context ingestion. The update decides how `pdf`, `docx`, `xlsx`, `pptx`, `csv`, `md/markdown`, `txt`, `png`, and `jpg/jpeg` should be treated before uploaded files can become approved context.

## Layer Impact

- Release lane: `internal-admin`.
- Internal admin layer: gives operators and implementation agents a clear format policy for future pilot setup workflows.
- Client data architecture reference: clarifies which file types can enter approved context ingestion versus metadata-only, evidence attachment, clarification, or OCR queues.
- Runtime: no runtime code changes in this PR.

## Client Applicability

- All clients: Applies as architecture guidance for future pilot ingestion workflows.
- Specific clients: None.
- Internal only: ADR amendment and release record are internal documentation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/adr/ADR-0008-context-ingestion-guardrails.md`
- `docs/releases/records/2026-06-01-context-ingestion-format-matrix.md`

## QA / Validation

- Pass: `npx prettier --write docs/architecture/adr/ADR-0008-context-ingestion-guardrails.md docs/releases/records/2026-06-01-context-ingestion-format-matrix.md`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No production deploy, migration, feature flag, parser change, or data-plane rollout is required because this is architecture documentation only.

## Rollback Plan

Revert the PR to remove the ADR amendment and release record.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2775
- Local validation output: Prettier completed; `git diff --check` passed; `npm run release:check -- --base origin/main --head HEAD` passed after QA status was made explicit.

## Known Gaps

This PR does not implement OCR, parser changes, admin setup UI, tenant persistence, quarantine tables, or private data-plane processing.
