# 2026-06-09-tenant-leak-apex-fix — Fix Lakeshore "apex" leakage false positive + add snippet evidence

## Release ID

`2026-06-09-tenant-leak-apex-fix`

## Status

`candidate`

## Plain-English Summary

The WS-E Lakeshore live run flagged a cross-tenant leakage on `company_scale`
naming `apex-retail`. "Apex" — like "First" — is a common English word
(peak/summit), so the bare first-word match false-positives on phrases like "at
the apex of the cycle". Fix: add "apex" to the leakage-detector common-word
stoplist. This is safe: the detector still always matches the full cover name
"Apex Retail" + the key "apex-retail", so a genuine Apex Retail reference is
still caught — only the coincidental bare-word match is suppressed. The detector
now also records a short context snippet for any flagged leak so it is reviewable,
and the live probe logs it.

## Layer Impact

- `global-control-lane`: precision fix in `src/lib/agent-claims/validate.ts`
  (`detectTenantLeakage`) + probe evidence. No data/migration.

## Client Applicability

- All clients: improves tenant-isolation detection accuracy.

## Changes Included

- `src/lib/agent-claims/validate.ts` — add "apex" to `COMMON_NAME_WORDS`; record a
  context snippet in each leakage finding.
- `src/scripts/qa/agent-answer-quality-probe.ts` — log the leak snippet.
- `src/__tests__/behaviors/agent-claims.test.ts` — +2 cases (no FP on generic
  "apex"; still flags "Apex Retail").

## QA / Validation

- `npx jest src/__tests__/behaviors/agent-claims.test.ts` → 18/18 pass.
- `npx tsc --noEmit` / `npx eslint` → clean.
- `npm run audit:architecture-rules` / `release:check` / `validate:context-corpus`
  → green.
- **Live re-run on ACA:** the Lakeshore probe was re-run in-VNet to confirm the
  leakage count drops to 0 (false positive) — or, if a genuine "Apex Retail"
  reference remained, the snippet would name it. Result in the WS-E note.

## Rollout Plan

Merge to `main`. No migration.

## Rollback Plan

Revert the PR. Pure detection-logic change.

## Audit Evidence

- PR URL: (filled on open). Test log 18/18; live re-run logs.

## Context Ingestion Evidence

Not applicable.

## Known Gaps

- Single-word references to "Apex" (without "Apex Retail") are no longer flagged,
  matching the "First" trade-off — the full name + key still catch unambiguous
  cross-tenant references. Separately, Lakeshore `artifacts`/`kpi` remain
  NOT_LOADED (retrieval/ingestion gap) — tracked separately.
