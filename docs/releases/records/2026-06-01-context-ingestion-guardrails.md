# 2026-06-01-context-ingestion-guardrails — Context Ingestion Guardrails ADR

## Release ID

`2026-06-01-context-ingestion-guardrails`

## Status

`candidate`

## Plain-English Summary

Adds an architecture decision record for pilot context ingestion guardrails: template-first uploads, data-load consent, quarantine, anomaly clarification, supported formats, upload limits, parse-once reuse, and control-plane/data-plane separation.

## Layer Impact

- Release lane: `internal-admin`.
- Internal admin layer: defines the future setup workflow operators should implement and review.
- Client data architecture reference: documents how client-uploaded context should be treated before it enters evidence, retrieval, or generated deliverables.
- Runtime: no runtime code changes in this PR.

## Client Applicability

- All clients: Applies as architecture guidance for future pilot ingestion workflows.
- Specific clients: None.
- Internal only: ADR and release record are internal documentation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/adr/ADR-0008-context-ingestion-guardrails.md`
- `docs/architecture/adr/README.md`
- `docs/releases/records/2026-06-01-context-ingestion-guardrails.md`

## QA / Validation

- Pass: `npx prettier --write docs/architecture/adr/ADR-0008-context-ingestion-guardrails.md docs/architecture/adr/README.md docs/releases/records/2026-06-01-context-ingestion-guardrails.md`
- Pass: `git diff --check`
- Pass: `git diff --check origin/main..HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No production deploy, migration, feature flag, or data-plane rollout is required because this is architecture documentation only.

## Rollback Plan

Revert the PR to remove the ADR, ADR index row, and release record.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2766
- Local validation output: Prettier completed; `git diff --check` passed.
- Local validation output: `npm run release:check -- --base origin/main --head HEAD` passed.

## Known Gaps

This PR does not implement the admin setup UI, Azure Document Intelligence parsing, tenant persistence, quarantine tables, notifications, or private data-plane deployment. Those remain separate implementation backlog items.
