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

## Real finding (corrected)

The live re-run's snippet proved the Lakeshore leak is REAL, not a false
positive: Lakeshore's company_scale answer read "Lakeshore Holdings (legal
entity: **Apex Retail Group Composite Seed**)". The string exists ONLY in the
live Lakeshore DB record (not the repo source) — a synthetic-seed artifact that
embedded another tenant's cover name into Lakeshore's enterprise profile,
violating cover-name isolation. The detector caught it via the full-name match
(the "apex" stoplist correctly did NOT suppress it). Fix = the detector-precision
change (avoids bare-"apex" FPs) PLUS a surgical data scrub:
`src/scripts/governance/scrub-lakeshore-apex-contamination.ts` replaces the Apex
cover-name tokens in Lakeshore's chunks/facts/records (scoped to Lakeshore,
idempotent), run in-VNet on ACA. Post-scrub probe confirms leakage 0.

## Known Gaps

- Single-word "Apex" (without "Apex Retail") references are no longer flagged
  (the "First" trade-off); the full name + key still catch unambiguous leaks.
- Lakeshore `artifacts`/`kpi` remain NOT_LOADED (separate retrieval/ingestion gap).
