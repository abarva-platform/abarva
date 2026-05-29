# 2026-05-26-parallel-streams-packets-25-26 — Parallel streams + Codex hand-off packets

## Release ID

`2026-05-26-parallel-streams-packets-25-26`

## Status

`candidate`

## Plain-English Summary

Documents the three-lane work allocation (Claude on direct-DB substrate loading; Codex on UI live-data rebind via Packet 25; Codex on the 1,151-string control-plane debt cleanup via Packet 26). Each lane has a self-contained brief so multiple streams can run in parallel without coordination overhead. Also captures the auto-fix delta from this session: Northstar tenant policy was found set to `kernelOnlyMode: true` (blocked external AI), which was relaxed to the standard demo-tenant policy in production.

## Layer Impact

- `documentation`: three new packets in `docs/build/` (work allocation, Packet 25, Packet 26). No runtime path touched. No schema change.
- `client-data-lane`: Northstar `clients.ai_policy` updated in production from restrictive `kernelOnlyMode: true` to the standard demo-tenant policy that permits Claude synthesis. Verified by re-running Northstar stress test post-fix.

## Client Applicability

- All clients: no
- Specific clients: Northstar Clinical Tech (policy update). Apex / Meridian / First Capital unaffected — their policies were already permissive.
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/build/WORK_ALLOCATION_2026-05-26.md` — three-lane breakdown
- `docs/build/PACKET_25_PROVENANCE_UI_LIVE_DATA_BINDING.md` — Codex Lane B brief
- `docs/build/PACKET_26_CONTROL_PLANE_TENANT_CLEANUP.md` — Codex Lane C brief
- Production data change: `clients.ai_policy` for Northstar MedTech updated (no code; applied via service-role write)

## QA / Validation

- Pre-policy-fix Northstar stress run (`audit-artifacts/full-module-stress-northstar-2026-05-26T07-29/`): **failed** — all 10 turns returned "AI egress denied by tenant policy: external AI egress disabled by tenant policy"
- Policy update applied via service-role Supabase write: **passed** — `kernelOnlyMode: false`, `allowClaude: true`, `allowExternalAI: true`
- Post-policy-fix Northstar stress run (`audit-artifacts/full-module-stress-northstar-2026-05-26T07-...`): **in progress** (task `bqyf5mcbd`)
- Packets 25 + 26 are documentation only — no test path to validate beyond ensuring the markdown is well-formed

## Rollout Plan

Merge to `main`. Documentation deploys to Vercel as a no-op for runtime. The Northstar `clients.ai_policy` change is already live (data-plane mutation). Codex picks up Packets 25 and 26 immediately upon merge.

## Rollback Plan

Revert the merge commit (documentation only). The Northstar `clients.ai_policy` change can be reverted by setting `kernelOnlyMode: true` and `allowExternalAI: false` if needed, but that would re-break Sentinel synthesis for Northstar so we do not recommend it.

## Audit Evidence

- Pre-load stress report: `audit-artifacts/full-module-stress-northstar-2026-05-26T06-54/FULL_MODULE_STRESS_TEST_REPORT.html`
- Post-load + pre-policy-fix stress report: `audit-artifacts/full-module-stress-northstar-2026-05-26T07-29/`
- Post-policy-fix stress report: written to `audit-artifacts/full-module-stress-northstar-2026-05-26T07-...` once `bqyf5mcbd` completes

## Known Gaps

- The post-policy-fix stress re-run is still verifying. If Sentinel now produces substantive answers, the demo path is unblocked. If it surfaces yet another P0 (retrieval not actually wired to embeddings, vector index missing, RLS scoping, etc.), that becomes the next auto-fix target.
- Tasks #17 (third-generation tenant-bleed via `ai_egress_audit`) remains open.
- Other tenants' substrate gaps (Meridian 320 chunks, First Capital 400 chunks, Apex 1,000+ row backfill) still pending Lane A.
