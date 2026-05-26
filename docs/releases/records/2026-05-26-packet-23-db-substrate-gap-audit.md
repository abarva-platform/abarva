# 2026-05-26-packet-23-db-substrate-gap-audit — Packet 23 DB Substrate Gap Audit

## Release ID

`2026-05-26-packet-23-db-substrate-gap-audit`

## Status

`candidate`

## Plain-English Summary

Adds an audit script and a critical-finding writeup documenting that 2,741 substrate rows are missing across the four composite tenants. The dataset files exist on disk under `datasets/` for Apex / Meridian / First Capital / Northstar, but the actual ingestion into Supabase never ran for 3 of 4 tenants — only Apex has corpus chunks loaded (and even Apex has only 9 of 120 spec'd applications). Northstar has zero substrate of any kind except the 5 personas provisioned earlier this session. The `/admin/context-layer` provenance UI that the user wanted to demo is reading from a hardcoded mock (`northstar-read-model.ts`) rather than real ingestion records. This release adds the audit tooling and decision-point packet so the user can choose between three remediation paths before the upcoming Northstar CXO demo.

## Layer Impact

- `ops-release-lane`: adds `scripts/audit/db-substrate-audit.mjs` (parameterized substrate row-count audit across all 4 tenants, with disk-spec vs Supabase-actual diff). No runtime path touched. No schema change. No tenant-data write.
- `documentation`: adds Packet 23 audit + decision-point writeup as `docs/build/PACKET_23_DB_SUBSTRATE_GAP_AUDIT.md`.

## Client Applicability

- All clients: yes — the gap affects every composite tenant
- Specific clients: Apex Retail (167 rows missing), Meridian Health (579), Brindlemark/First Capital (747), Northstar MedTech (1,248)
- Internal only: yes — audit tooling + decision packet for the user
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/audit/db-substrate-audit.mjs` — substrate row-count audit
- `docs/build/PACKET_23_DB_SUBSTRATE_GAP_AUDIT.md` — finding + roadmap + decision point
- PR: this PR

## QA / Validation

- `node --check scripts/audit/db-substrate-audit.mjs`: **passed**
- Live run against prod Supabase: **passed** — produced the audit table referenced in PACKET_23
- Findings cross-referenced with `northstar-read-model.ts`: **confirmed** that `/admin/context-layer` reads hardcoded mock values, not real ingestion records
- No regression risk — read-only audit tooling

## Rollout Plan

Merge to `main`. No production rollout — documentation + audit script only. Decision point requires user input:

- **Option A**: build a multi-tenant substrate loader (Packet 24) + real-data provenance UI binding (Packet 25). Estimated 1–2 day Codex sprint. Demo shows real numbers everywhere.
- **Option B**: keep mock provenance UI for demo + run a targeted Northstar-chunks-only load. Half-day Codex sprint.
- **Option C**: present platform as-is. Sentinel honestly confesses missing substrate. Demo focuses on agent grounding-honesty, not substantive facts.

## Rollback Plan

Revert the merge commit. No runtime, no schema, no policy change.

## Audit Evidence

- Audit run output captured in Packet 23 (Part: "The numbers"). Top-line: 2,823 expected rows across gapped tables, 82 actual, 2,741 missing.
- Northstar gap is total — 0 / every table.
- Apex is the only tenant with `enterprise_context_chunks > 0` (280 chunks loaded).

## Known Gaps

- This packet is documentation + audit tooling. The actual loader (Packet 24) and real-data UI binding (Packet 25) are deferred pending user decision.
- The `/admin/context-layer` mock UI is intentionally not changed in this PR — Packet 25 is where that work lands.
- Task #17 (third-generation tenant-bleed via `ai_egress_audit`) remains open and is not in scope.
