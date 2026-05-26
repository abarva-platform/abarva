# 2026-05-26-loader-criticality-tier4-fix — Loader criticality tier4→tier3 + per-row diagnostics

## Release ID

`2026-05-26-loader-criticality-tier4-fix`

## Status

`candidate`

## Plain-English Summary

Two loader fixes plus a milestone audit. The `applications.criticality` CHECK constraint accepts only `tier1` / `tier2` / `tier3` — NOT `tier4` (re-probed empirically when Meridian apps insert failed). Mapper now collapses `tier4` / `low` / `p3` down to `tier3`. Plus per-row fallback diagnostic when a batch insert fails — surfaces the specific bad row instead of failing the entire 100-row batch silently.

After this fix, Meridian's 140 apps load cleanly. Combined with Codex Streams D and E (now visible in audit — First Capital substrate fully loaded at 400 chunks / 180 apps / 49 initiatives / 70 contracts), all four composite tenants have substantial substrate.

## Layer Impact

- `ops-release-lane`: `scripts/seed/load-tenant-substrate.ts` — `mapCriticality` returns `tier3` for `low`/`p3`/`tier4`. Phase 3 batch-insert falls back to per-row when an entire batch fails to identify the offending column value.
- `client-data-lane`: 140 Meridian applications inserted (was 0). 9 net new Apex apps may have been inserted by the same loader run (was 9, dataset has 120 — but most likely the prior 9 were a different shape; loader deletes existing demo rows on idempotent re-run).
- No schema change, no policy change.

## Client Applicability

- All clients: yes — loader behavior change is global
- Specific clients: Meridian benefits immediately (140 apps now visible). All tenants benefit from clearer error messages on future loads.
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/seed/load-tenant-substrate.ts` — mapCriticality + per-row diagnostic fallback
- Production data: 140 Meridian rows inserted into `applications`

## QA / Validation

- Empirical probe of `applications.criticality` CHECK: **passed** — only tier1/tier2/tier3 accepted; tier4 rejected
- Re-run loader for Meridian: **passed** — 140/140 inserted, zero errors
- Post-run substrate audit: **passed** — Meridian apps now read `140/140`
- Northstar apps unchanged (already at 240/240 from prior run)

## Rollout Plan

Merge to `main`. No runtime change. Loader is now more diagnostic when batch inserts fail. Same loader script used for Meridian + Apex + Northstar will continue working; First Capital was loaded by Codex Stream D using a different path but the same target tables.

## Rollback Plan

Revert this PR. Loader returns to prior batch-only error reporting. The 140 Meridian rows can be cleaned with `DELETE FROM applications WHERE client_id = 'a20ecef5-f0ea-4890-b9d5-7375fab223ff' AND is_demo_data = true` if needed.

## Audit Evidence

- Substrate audit pre-fix: Meridian apps 0/140 (also Northstar 240/240 from prior load)
- Substrate audit post-fix: Meridian apps **140/140 ✓**
- Cross-tenant state shows Codex Streams D and E landed during this window — First Capital fully loaded

## Known Gaps

- `enterprise_context_source_files` still 0 for Meridian/First Capital/Northstar (UUID FK constraint; provenance preserved at chunk level)
- `ai_initiatives` not loaded for Meridian (7/28) or Northstar (0/80); 49/32 for First Capital (Codex Stream D loaded these via a different path)
- `vendor_contracts` not loaded for Meridian (0/50) or Northstar (0/90); 70/70 for First Capital
- `teams` not loaded for any tenant
- Task #17 remains open
