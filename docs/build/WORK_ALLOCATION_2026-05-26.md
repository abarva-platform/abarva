# Work Allocation — 2026-05-26 (parallel streams)

**Context:** The Northstar CXO demo is the time-bound goal. Multiple work streams need to run in parallel — Claude on direct-DB work, Codex on UI / architectural work. This doc is the single source of truth for who's doing what.

---

## Lane assignments

### Lane A — Claude (this session, autonomous)

**Owns:** anything that needs direct Supabase access, schema probing, or live API calls. Fast iteration loop.

- ✅ **DONE** — STRESS-P0-008 (tenant resolver) shipped in PR #2354
- ✅ **DONE** — Control-plane purity scanner + baseline + Northstar zero-floor regression — PR #2354
- ✅ **DONE** — DB substrate gap audit — PR #2356
- ✅ **DONE** — Packet 24 loader built + Phase 2 chunks loaded for Northstar (720/720 embedded) — PR #2356
- 🔄 **IN FLIGHT** — Northstar stress re-run against loaded substrate (background task `bfypf4ewv`)
- 🚧 **NEXT** — Loader Phase 3 (240 Northstar apps; needs `deployment_model` CHECK enum probe)
- 🚧 **NEXT** — Loader Phase 4 (80 Northstar initiatives) + Phase 5 (90 vendor contracts)
- 🚧 **NEXT** — Run loader for Meridian (320 chunks) and First Capital (400 chunks)
- 🚧 **NEXT** — Top up Apex's 167-row gap
- 🚧 **NEXT** — Verify cost-rollup on stress runs now shows real `cost_source` (the 720 audit rows landed)

### Lane B — Codex (handed off via Packet 25, can start immediately)

**Owns:** `/admin/context-layer` UI rebinding from hardcoded mock data to live Supabase queries. The provenance trail the user asked for ("trace back to the process of loading data") must read from real ingestion records.

**Packet:** `docs/build/PACKET_25_PROVENANCE_UI_LIVE_DATA_BINDING.md` (in this PR)

**Bounded scope:**
- `src/lib/context-ingestion/northstar-read-model.ts` → rename to `tenant-context-read-model.ts`, make tenant-parameterized
- Replace hardcoded constants (`NORTHSTAR_INGESTION_STAGES`, etc.) with server-side queries:
  - Stages computed from `enterprise_context_chunks.embedding_status` counts
  - File list from distinct `source_doc` values in `enterprise_context_chunks` for the active tenant
  - Embedding history from `ai_egress_audit` filtered to `workflow='substrate-loader-embed'`
- Update all 5 admin/context-layer subroutes to use the new parameterized helpers
- Remove the `runNorthstarContextIngestion` mock demo from `/admin/context-layer/uploads/page.tsx` — replace with a real list of `source_doc` rows

**Out of scope for Lane B:** the loader itself (that's Lane A), the dataset files (already on disk), Sentinel grounding behavior (already wired through `enterprise_context_chunks.embedding`).

### Lane C — Codex (handed off via Packet 26, can start in parallel)

**Owns:** the 1,151-string control-plane / data-plane cleanup. Long-running, low-coordination, parallelizable across files.

**Packet:** `docs/build/PACKET_26_CONTROL_PLANE_TENANT_CLEANUP.md` (in this PR)

**Bounded scope:**
- Worst offenders: Apex Retail (663), Heliara (204), Brindlemark (149), Meridian Health (77), First Capital (57)
- Goal: drive baseline `scripts/audit/control-plane-tenant-purity.baseline.json` down from 1,151 → < 200 over multiple PRs
- Each file: move tenant-specific content to `src/data/<tenant>/` or to Supabase corpus chunks. Replace control-plane references with `getActiveClientRow()` resolution.
- CI guard already in place (`npm run audit:control-plane-purity:check`) — Codex can iterate safely; PR will fail if Codex regresses any count, pass if any goes down.

**Out of scope for Lane C:** Northstar references (already at zero — the hard-floor regression locks that in).

---

## Communication protocol

**Coordination points** (where lanes touch):
- Lane A's loader writes to `enterprise_context_chunks`. Lane B's UI reads from `enterprise_context_chunks`. Schema is stable today; coordinate before changing.
- Lane C's cleanup may rename `src/data/arcturus/*` exports. Lane A's loader doesn't touch `src/data/`. Lane B reads from `enterprise_context_chunks` not `src/data/`. → no expected conflict.

**Daily sync** (informally, in chat): each lane reports row counts + PR numbers shipped. Claude posts substrate audit deltas; Codex posts file count + baseline delta.

**Shared veto authority** — any lane can flag the other for tenant-pin violations on PR review. Use the control-plane purity scanner output (`npm run audit:control-plane-purity`) as the objective truth.

---

## Demo gate checklist (before Northstar CXO demo)

| Item | Lane | Status |
|---|---|---|
| Tenant resolver works for Northstar | A | ✅ |
| 720 Northstar corpus chunks loaded + embedded | A | ✅ |
| Sentinel grounds substantively in Northstar facts | A | 🔄 verifying |
| Provenance UI shows real ingestion records | B | 🚧 starts now |
| 240 Northstar apps loaded into `applications` | A | 🚧 next |
| 80 initiatives + 90 contracts loaded | A | 🚧 next |
| `/admin/context-layer` reads from live Supabase, not mock | B | 🚧 starts now |
| Cross-tenant control-plane debt visible & shrinking | C | 🚧 starts now |
| No new Apex/Meridian/First Capital strings landed since baseline | C | ✅ enforced via CI |

**Demo-blocking items**: anything ❌. **Demo-improving items**: anything 🚧. The demo CAN fire today on what's ✅ — just less impressive than option (a) post-completion.

---

## How to start each Codex stream

Hand Codex these two prompts (file paths after this PR merges to main):

1. **Stream B**: `docs/build/PACKET_25_PROVENANCE_UI_LIVE_DATA_BINDING.md`
2. **Stream C**: `docs/build/PACKET_26_CONTROL_PLANE_TENANT_CLEANUP.md`

Both packets are self-contained — they specify scope, schema contracts, success criteria, and out-of-scope items. Codex needs no further briefing.

---

## My next 60 minutes (Lane A only)

1. Wait for the Northstar stress re-run to finish (`bfypf4ewv`) — interpret results.
2. Probe `applications.deployment_model` CHECK enum, fix Phase 3 mapper, re-run loader for Northstar apps (240 rows).
3. Implement Phase 4 (`ai_initiatives` — 80 rows for Northstar).
4. Implement Phase 5 (`vendor_contracts` — 90 rows for Northstar).
5. Extend `TENANT_PROFILES` in loader for Meridian + First Capital; run them.
6. Re-audit; ship the Phase 3-5 + multi-tenant load as the next PR.
