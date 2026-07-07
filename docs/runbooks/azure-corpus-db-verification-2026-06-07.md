# Corpus DB + Azure Search Verification — 2026-06-07 (read-only)

**Purpose:** settle which database the app/corpus layer reads and whether
`PAT-LSH-D18-00479` (bound to the "Kyriba global treasury rollout" decision in the Intelligence
brief) is a real pattern or phantom. **Read-only. No mutations. No secrets printed.**

**Execution context:** run from the **private Azure VNet runtime** (VNet-integrated container,
user-assigned managed identity `id-abarva-scale-runtime-lab-eastus`), not a public local shell.
Postgres resolved on the **private address `10.43.1.4`**.

## 1. Which DB the runtime actually reads
| Setting | Value |
|---|---|
| `DATABASE_URL` target | `pg-abarva-context-lab-001.postgres.database.azure.com:5432` / db **`abarva_control`** |
| `ABARVA_AZURE_DATABASE_URL` | **not set** in runtime (web app + `job-abarva-private-operator-eus` both wire only `DATABASE_URL` → KV `azure-postgres-control-database-url`) |
| Corpus connection source (post-#3231) | `DATABASE_URL` (fallback, since ABARVA_AZURE_DATABASE_URL absent) |
| `current_database()` | `abarva_control` |
| `current_user` | `abarvaadmin` |
| `inet_server_addr()` | **`10.43.1.4`** (private) |
| `inet_server_port()` | 5432 · PostgreSQL 16.13 |
| `search_path` | `"$user", public` |
| Databases on server | `abarva_audit`, `abarva_context`, `abarva_control`, `azure_maintenance`, `azure_sys`, `postgres` |

**Finding:** the app reads `abarva_control`. #3231's "prefer ABARVA_AZURE_DATABASE_URL" is a no-op
today because that var is not configured; it falls back to the same `abarva_control`.

## 2. Corpus inventory in `abarva_control`
| Table / metric | Count |
|---|---|
| `corpus_patterns` total | **9,026** (treasury/Kyriba/payment subset: 294) |
| `genome_patterns` total | **43,436** |
| `genome_patterns` by vertical | airline 12,689 · healthcare_provider 11,825 · retail 11,440 · banking 4,680 · medtech 2,490 · cross_industry 300 · **diversified_holdco 12** |
| `genome_patterns` treasury/Kyriba/TMS subset | **791** |
| **`PAT-LSH-D18-00479` in `corpus_patterns`** | **ABSENT ([])** |
| **`PAT-LSH-D18-00479` in `genome_patterns`** | **ABSENT ([])** |

> The "~10k patterns" claim is confirmed real: `corpus_patterns` = 9,026 (plus 43,436 genome rows).
> An earlier snapshot (2026-06-06 ~22:00) showed only 52 genome rows — the full corpus was loaded
> into `abarva_control` afterward (consistent with the private-operator corpus-azure-first load).

### Real Lakeshore treasury/Kyriba patterns (the ones that SHOULD bind)
`LSH-TMS-001 … LSH-TMS-012`, e.g.:
- **`LSH-TMS-002` — "Bank connectivity matrix clears before rollout confidence is claimed"** ← best fit for a Kyriba rollout
- **`LSH-TMS-009` — "Payment approval and BEC controls are rollout acceptance criteria"**
- `LSH-TMS-001` daily cash pre-walk · `LSH-TMS-003` ERP feed quality gate · `LSH-TMS-006` intercompany rec Wave 1 · `LSH-TMS-012` banking consolidation precedes automation.

## 3. Azure Search cross-check (service `srch-abarva-context-lab-eastus`)
| Index | Doc count |
|---|---|
| `lakeshore-patterns-v1` (runtime Lakeshore pattern index) | **12** (all `LSH-TMS-*`) |
| `corpus-global` | 39 |
| `industry-corpus-v1` | **0** (empty) |
| `tenant-context-v1` | (Lakeshore context load, 5,247) |

Sample query `"Kyriba treasury modernization rollout"` on `lakeshore-patterns-v1` → top hits
`LSH-TMS-001, LSH-TMS-009, LSH-TMS-002, LSH-TMS-006, LSH-TMS-012` (correct, on-domain).
Exact lookup of `PAT-LSH-D18-00479` in the index → **[] (absent)**.

## 4. Outcome
- **`PAT-LSH-D18-00479` is PHANTOM** — absent from `corpus_patterns` (9,026), `genome_patterns`
  (43,436), and `lakeshore-patterns-v1`. The Intelligence decision card bound the Kyriba bet to a
  **non-existent pattern id** instead of a real `LSH-TMS-*` pattern. This is an ungrounded/fabricated
  pattern citation on a 90/100 decision card.
- **Recommended fix (separate small PR — NOT the Lakeshore load PR):** make the Intelligence→Move
  pattern binder **fail closed on unknown pattern IDs** (reject any `patternId` not present in
  `corpus_patterns`/`genome_patterns`/`lakeshore-patterns-v1`) and bind/surface the top real match
  (e.g., `LSH-TMS-002`). Binder code **not changed in this verification** per instruction.
- The corpus DB/index path is healthy; no retrieval rewiring needed (runtime correctly reads
  `abarva_control` + `lakeshore-patterns-v1`). The bug is the phantom id, not the DB path.

## Read-only commands used (via private VNet runtime)
```sql
select current_database(), current_user, inet_server_addr(), inet_server_port(), version();
show search_path;
select datname from pg_database where datistemplate=false order by datname;
select to_regclass('public.corpus_patterns');           select count(*) from corpus_patterns;
select to_regclass('public.genome_patterns');           select count(*) from genome_patterns;
select vertical, count(*) from genome_patterns group by 1 order by 2 desc;
select code,name from genome_patterns where code='PAT-LSH-D18-00479';      -- []
select code,name from corpus_patterns where code='PAT-LSH-D18-00479';      -- []
select code,name from genome_patterns where code ilike 'LSH-TMS%' order by code;
```
Azure Search (AAD via MI): `GET /indexes/{idx}/docs/$count`; `POST /indexes/lakeshore-patterns-v1/docs/search` (Kyriba query + exact id lookup).
