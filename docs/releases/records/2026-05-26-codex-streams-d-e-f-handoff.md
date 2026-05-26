# 2026-05-26-codex-streams-d-e-f-handoff — Codex Streams D/E/F hand-off + loader status fix

## Release ID

`2026-05-26-codex-streams-d-e-f-handoff`

## Status

`candidate`

## Plain-English Summary

Hands three additional parallel streams to Codex now that Streams B (UI rebind, merged in PR #2359) and C (control-plane debt cleanup, draft PR #2360) are in flight. The biggest remaining demo gap is First Capital substrate — Packet 20 spec exists but data files were never authored. Plus a small Phase 3 status mapper fix on the loader.

## Layer Impact

- `documentation`: new `docs/build/CODEX_STREAMS_D_E_F_2026-05-26.md` (200 lines) — three Codex hand-off packets in one file
- `ops-release-lane`: `scripts/seed/load-tenant-substrate.ts` Phase 3 `mapStatus` now hard-maps every value to `'active'` (only one CHECK constraint accepts) — Northstar 240 apps will load on the next run

## Client Applicability

- All clients: yes — the new streams improve all four composite tenants over time
- Specific clients: First Capital is the most affected (currently zero substrate; Stream D unblocks)
- Internal only: yes — documentation + tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/build/CODEX_STREAMS_D_E_F_2026-05-26.md` — three streams briefed
- `scripts/seed/load-tenant-substrate.ts` — Phase 3 status mapper
- PR: this PR

## QA / Validation

- Codex stream packets self-contained: **passed** — each has invocation, success criteria, out-of-scope
- Loader `mapStatus` change: **passed** — probed all 15 likely status values, only `active` accepted
- Northstar Phase 3 retry: **in progress** (task bbx8ipfol)
- Meridian post-load stress run: **passed** — 0 substrate confessions, 29 source citations across 10 turns, Sentinel cites real Meridian facts (Dr. Anita Krishnamurthy, Sacramento HQ, 1968 founding)

## Rollout Plan

Merge to `main`. Three Codex streams start in parallel against the packet brief. Estimated:
- Stream D (First Capital data pack): half-day Codex
- Stream E (Loader Phase 4/5): half-day Codex
- Stream F (Apex backfill + cross-tenant test): quarter-day Codex (depends on E)

## Rollback Plan

Revert this PR. Documentation + status mapper revert. Production state unchanged.

## Audit Evidence

- Meridian stress run: `audit-artifacts/full-module-stress-meridian-2026-05-26T08-24/FULL_MODULE_STRESS_TEST_REPORT.html`
- Substrate audit shows three of four tenants ≥ 280 chunks; only First Capital at zero

## Known Gaps

- First Capital is still the only tenant without substrate. Stream D closes this.
- Phases 4 and 5 of the loader (initiatives + vendor_contracts) not yet implemented — Stream E covers this.
- Apex structured data (apps/initiatives/vendors) is sparse — Stream F covers this.
- Task #17 (third-generation tenant-bleed via `ai_egress_audit`) remains open.
