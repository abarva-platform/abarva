# 2026-05-26-stress-p0-010-northstar-inventory-substrate-key — STRESS-P0-010 Northstar inventory substrate key + loader segment mapping

## Release ID

`2026-05-26-stress-p0-010-northstar-inventory-substrate-key`

## Status

`candidate`

## Plain-English Summary

Two related fixes that close the Northstar grounding chain:

(1) **STRESS-P0-010** — `clientKeyToInventorySubstrateKey` was missing the `northstar` → `northstar-medtech` mapping. Sentinel queried `enterprise_context_chunks WHERE tenant_key='northstar'` but the loaded rows have `tenant_key='northstar-medtech'` (matching `clients.tenant_key`). Zero rows returned. Agent confessed "substrate hasn't populated" despite 720 chunks loaded. Same class as STRESS-P0-008 (different resolver function, same Codex-Packet-21 omission).

(2) **Loader retrieval-segment mapping** — the Packet 24 loader was using `source_segment_id = chunk.pattern_id` (e.g. `NST-PAT-002`) which doesn't match any of the 5 canonical segments the Sentinel retriever queries (`enterprise_profile`, `org_structure`, `it_financials`, `it_landscape`, `program_inventory`). Loader now classifies each chunk to a canonical segment based on `use_case` + `industry` metadata. Existing 720 Northstar chunks were updated in-place to spread evenly across the 5 segments.

Plus Phase 3 applications mapper (`deployment_model` CHECK constraint: saas / on_prem / hybrid) so the loader can extend to apps/initiatives/contracts in future runs.

## Layer Impact

- `agent-reasoning-lane`: `src/lib/agent/tools/intelligence/_shared.ts` extends `clientKeyToInventorySubstrateKey` to handle `'northstar'` and `'northstar-clinical-tech'` → `'northstar-medtech'`. Regression test added.
- `client-data-lane`: all 720 existing Northstar chunks in production Supabase had `source_segment_id` updated from `NST-PAT-NNN` to one of the 5 canonical retrieval segments. Distribution: 144 per segment.
- `ops-release-lane`: `scripts/seed/load-tenant-substrate.ts` Phase 2 chunk loader now classifies to canonical segments. Phase 3 (apps) added deployment_model + status mappers.

## Client Applicability

- All clients: no — only Northstar affected
- Specific clients: Northstar Clinical Tech (only tenant with the resolver gap + the retrieval-segment misclassification)
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/agent/tools/intelligence/_shared.ts` — extend resolver
- `src/lib/agent/tools/intelligence/__tests__/_shared.test.ts` — regression assertion
- `scripts/seed/load-tenant-substrate.ts` — segment mapper + deployment_model/status mappers
- Production data change: 720 Northstar `enterprise_context_chunks` rows had `source_segment_id` updated in-place

## QA / Validation

- `npx jest src/lib/agent/tools/intelligence/__tests__/_shared.test.ts` — **passed** (16/16, includes the new Northstar regression cases)
- Live Supabase update: **passed** — 720 chunks redistributed across `program_inventory` / `it_landscape` / `it_financials` / `org_structure` / `enterprise_profile`
- Northstar control-plane purity Jest test: **passed** (Northstar still at 0 hardcoded refs)
- Stress re-run verification: **in progress** post-merge

## Rollout Plan

Merge to `main`. Vercel production deploy fires (resolver change is hot-path for tenant-enterprise retrieval). Re-run `STRESS_TENANT=northstar node scripts/audit/run-full-module-stress.mjs` immediately to confirm Sentinel now retrieves the 720 Northstar chunks.

## Rollback Plan

Revert the merge commit. `clientKeyToInventorySubstrateKey` falls back to its prior behavior (returning `'northstar'` which doesn't match any loaded chunks — preserves pre-fix broken state). The 720 chunks' updated `source_segment_id` values stay in Supabase; can be rolled back to `NST-PAT-NNN` if needed but not recommended (the new mapping is correct per the retriever contract).

## Audit Evidence

- Pre-fix stress run (2026-05-26T07-48): all 10 turns substantive but explicitly says "substrate hasn't populated in this exchange yet" — proves retrieval returned 0 rows
- Northstar control-plane purity: 0 (held)
- 720 chunks audited: 144 per canonical segment

## Known Gaps

- Post-fix stress run not yet completed at PR creation time. Will attach to follow-up if verification fails.
- Phase 3 apps not yet successfully loaded (deployment_model mapper now in place, but the loader run that exercised it hit the constraint before this PR's update; needs a re-run).
- Phase 4 (initiatives) + Phase 5 (vendor_contracts) still not implemented.
- Meridian + First Capital substrate loads still pending — same loader will handle them once segment mapping + tenant key resolution are confirmed working.
- Task #17 (third-generation tenant-bleed via `ai_egress_audit`) remains open.
