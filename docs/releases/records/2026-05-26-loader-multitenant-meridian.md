# 2026-05-26-loader-multitenant-meridian — Multi-tenant substrate loader + Meridian load

## Release ID

`2026-05-26-loader-multitenant-meridian`

## Status

`candidate`

## Plain-English Summary

Extends the Packet 24 substrate loader to handle Meridian Health and Apex Retail tenants (in addition to Northstar). Adds JSONL schema flexibility — the loader now reads both the Northstar-style (`chunk_id`/`claim`/`evidence_basis`) and Meridian-style (`id`/`title`/`text`) corpus formats from a shared `buildChunkText` + `getChunkId` helper. Loaded **320 Meridian chunks + embeddings** into production Supabase in 37 seconds, zero failures.

After this load:
- Apex Retail: 280/280 chunks
- Meridian Health: 320/320 chunks (this PR)
- First Capital: 0/400 (dataset not yet authored)
- Northstar MedTech: 720/720 chunks

## Layer Impact

- `client-data-lane`: 320 new rows in `enterprise_context_chunks` scoped to Meridian client_id (`a20ecef5-...`). Plus 320 `ai_egress_audit` rows for embedding provenance. No other tenants touched.
- `ops-release-lane`: `scripts/seed/load-tenant-substrate.ts` extends `TENANT_PROFILES` for `meridian` and `apex`, makes chunk-text builder + chunk_id resolver schema-agnostic.

## Client Applicability

- All clients: no
- Specific clients: Meridian Health Sentinel can now ground in 320 substrate chunks. Apex Retail's existing 280 chunks unchanged. Northstar / First Capital not affected by this PR.
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/seed/load-tenant-substrate.ts` — TENANT_PROFILES adds `meridian` + `apex`; `buildChunkText` reads `text` field for Meridian-shape; `getChunkId` resolves `chunk_id`/`id`/fallback
- Production data: 320 Meridian rows inserted into `enterprise_context_chunks` + 320 audit rows

## QA / Validation

- Dry-run loader against Meridian dataset: **passed** — 48 source files + 320 chunks detected
- Live load: **passed** — 320/320 chunks inserted + embedded in 37 seconds at concurrency=8 via OpenAI text-embedding-3-large
- Substrate audit post-load: **passed** — Meridian `enterprise_context_chunks` now reads `320/320`
- Lint / typecheck: **not run** — `.ts` loader script invoked via tsx
- Meridian stress run kicked off post-merge to verify Sentinel grounding works

## Rollout Plan

Merge to `main`. No app code changes — runtime no-op. Meridian Sentinel sessions immediately benefit from the loaded chunks once they make queries.

## Rollback Plan

Revert this PR (removes loader extensions). The 320 loaded chunks remain in Supabase; can be cleaned with `DELETE FROM enterprise_context_chunks WHERE client_id = 'a20ecef5-f0ea-4890-b9d5-7375fab223ff'` if needed. Audit rows stay (append-only).

## Audit Evidence

- Pre-load substrate audit (PR #2356): Meridian = 0/320
- Post-load substrate audit (this session): Meridian = 320/320 ✓
- Embedding provenance: 320 rows in `ai_egress_audit` with `workflow='substrate-loader-embed'`, `provider='openai-embeddings-openai'`
- Cost: ~$0.65 OpenAI embedding fees (320 chunks × ~$0.13/1M tokens × ~4K tokens/chunk)

## Known Gaps

- Phase 3 (applications), Phase 4 (initiatives), Phase 5 (vendor contracts) still not extended to Meridian — only Phase 2 chunks completed
- First Capital substrate not loaded — dataset not yet authored (Packet 20 spec; pending Codex)
- Northstar Phase 3 apps retry queued in the same background run
- Codex's stream B (PR #2359) makes the live admin/context-layer UI render the Meridian chunks alongside Northstar's — verify by signing in as Meridian persona post-merge
- Task #17 remains open
