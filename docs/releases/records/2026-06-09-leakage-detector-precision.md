# 2026-06-09-leakage-detector-precision — Fix cross-tenant leakage false positive

## Release ID

`2026-06-09-leakage-detector-precision`

## Status

`candidate`

## Plain-English Summary

The WS-G live run flagged a cross-tenant leakage on SkyHarbor's `kpi_value`
answer. Root cause: the leakage detector matched the bare first word of a tenant
cover name, and **"First Capital"** has the first word **"First"** — so any
answer saying "first quarter / first half" tripped a false positive. Fix: the
detector now matches the full cover name + the canonical key always, and the
lone first word only when it is a distinctive proper noun (common English words
like "first" are excluded). Genuine references ("First Capital", "Meridian") are
still caught; "first quarter" is not. The live probe now also names the
offending tenant so future runs are conclusive.

## Layer Impact

- `global-control-lane`: precision fix in `src/lib/agent-claims/validate.ts`
  (`detectTenantLeakage`) + a probe-evidence enhancement. No data/migration.

## Client Applicability

- All clients: Yes — improves tenant-isolation accuracy for every tenant.

## Changes Included

- `src/lib/agent-claims/validate.ts` — `COMMON_NAME_WORDS` stoplist; match full
  name + key + distinctive first word only.
- `src/scripts/qa/agent-answer-quality-probe.ts` — log offending tenant key(s).
- `src/__tests__/behaviors/agent-claims.test.ts` — +3 cases (no false positive on
  "first quarter"; still flags "First Capital" + "Meridian").

## QA / Validation

- `npx jest src/__tests__/behaviors/agent-claims.test.ts` → 16/16 pass.
- `npx tsc --noEmit` / `npx eslint` → clean.
- `npm run audit:architecture-rules` / `release:check` / `validate:context-corpus`
  → green.
- **Live re-run on ACA:** the SkyHarbor probe was re-run in-VNet to confirm the
  leakage count after the fix — see the WS-G live note update.

## Rollout Plan

Merge to `main`. No migration. The corrected detector is used by PR-4 validation
and the live probe.

## Rollback Plan

Revert the PR. Pure detection-logic change.

## Audit Evidence

- PR URL: (filled on open). Test log: 16/16. Live re-run logs.

## Context Ingestion Evidence

Not applicable.

## Known Gaps

- The stoplist is curated for the current canonical roster; extend it if a future
  tenant cover name's first word is a common English word.
