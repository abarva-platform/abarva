# Client Identity & Context Posture (Phase 1)

_Live-DB resolved 2026-06-10 via read-only ACA/VNet probe (`job-...-y0at6mk`, Succeeded).
No assumptions — tenant_keys below are the ACTUAL distinct keys present in the private data plane._

## Canonical identity (live-confirmed)

| Target client | App key | Canonical `tenant_key` (LIVE, present in DB) | Display name | Aliases / flags |
|---|---|---|---|---|
| **Apex Retail** | `apexretail` | **`apex-retail`** ✅ present | Apex Retail Group | App key has no dash; canonical/data-plane uses dash. Canonicalized by `current_tenant_key()`. |
| **Meridian Health** | `meridian` | **`meridian-health`** ✅ present | Meridian Health System | Retired codename **"Heliara Health"** canonicalized → Meridian (no `heliara` rows found in DB census). |
| **Lakeshore Holdings** | _unregistered in app alias layer_ | **`lakeshore-holdings`** ✅ present | Lakeshore Holdings | **NOT in `src/lib/tenant/aliases.ts`** despite live data — app-routing/retrieval risk. Email route `+lakeshore@thesundaram.com`. |

Names honored exactly. "Presbyterian/Northshore/Northstar" NOT used. (`northstar-clinical` is a separate
registered tenant with its own chunks — explicitly OUT of scope.) `clients` table column-name lookup
errored on assumed columns (`name`/`client_key`); `client_id` resolution deferred to load time via the
loader's own client resolver. Scoping in `enterprise_context_*` is by `tenant_key`, which is resolved.

## Live census (all tenants, for context)

| Table | apex-retail | meridian-health | lakeshore-holdings | skyharbor-air | others |
|---|--:|--:|--:|--:|--|
| `enterprise_context_sources` | 0 | 13 | 13 | 2 | — |
| `enterprise_context_source_files` | 42 | 15 | 13 | 15 | — |
| `enterprise_context_records` | **0** | 3,503 | 179 | 3,101 | — |
| `enterprise_context_facts` | **0** | 38,640 | 2,949 | 23,895 | — |
| `enterprise_context_chunks` | 6,497 | 3,506 | 1,542 | 6,341 | northstar 878 · first-capital 400 |
| `governed_object_readiness` (not_reviewed) | 6,498 | 3,548 | 1,542 | — | — |

## Integrity (targets)
- **Duplicate active facts: 0** (all targets). **Orphan facts: 0.** **Null/empty lifecycle facts: 0.**
- Meridian + Lakeshore facts are 100% `lifecycle_state='active'`.
- Citation metadata on active facts: Meridian `source_file` 38,640/38,640, `evidence_pointer` 38,640/38,640,
  `confidence` 38,640/38,640. Lakeshore `source_file` 2,949/2,949, `evidence_pointer` 2,949/2,949,
  `confidence` 2,936/2,949 (13 facts missing confidence — minor remediation).

## Posture headline
- **Apex Retail** has source_files + a large embedded chunk corpus but **zero structured records/facts** → `CHUNKS_ONLY`.
- **Meridian Health** has a full, citation-ready structured fact base across 15 enterprise dimensions → ahead; gated at indexing/promotion.
- **Lakeshore Holdings** has a smaller citation-ready fact base across 13 dimensions, partial embeddings, and an
  **app-registration gap** (no alias entry) → gated at embeddings/indexing/registration/promotion + enterprise-scale depth.

Promotion: **every** target object is `not_reviewed` (0 promotion_candidate, 0 agent_ready) → no client is agent-ready.
