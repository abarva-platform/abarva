# Codex Streams D, E, F — 2026-05-26 hand-off

**Context:** Three lanes already in flight (A = Claude DB loader, B = Codex UI rebind DONE, C = Codex debt cleanup PROGRESSING). Three additional Codex streams ready to start in parallel. Each is self-contained — no further briefing required.

---

## Stream D — First Capital synthetic substrate authoring (HIGHEST PRIORITY)

**Why this matters:** First Capital is the only one of four composite tenants with zero substrate. Apex/Meridian/Northstar all demo substantively now. First Capital can't.

**Spec already exists:** `docs/build/PACKET_20_FIRSTCAPITAL_SUBSTRATE_PROMPT.md` — 394-line authoring spec covering 180 apps / 520 integration edges / 32 active initiatives / 70 vendor contracts / 60 source files / 400 corpus chunks.

**What Codex builds:**

Author the data files under `datasets/firstcapital-financial-synthetic-v1/` matching the spec. Folder shape mirrors Apex (`datasets/apex-retail-synthetic-v1/`) and Northstar (`datasets/northstar-clinical-tech-synthetic-v1/`):

```
datasets/firstcapital-financial-synthetic-v1/
├── 01-portfolio/
│   ├── application-portfolio.csv      (180 rows — see Packet 20 §3)
│   ├── integration-topology.json      (520 edges)
│   ├── initiatives-active.csv         (32 rows — must include the 14 board-watched headlines)
│   └── initiatives-closed.csv         (16 rows)
├── 04-vendors/
│   ├── vendor-contracts.csv           (70 rows)
│   └── ...
├── 13-context/
│   ├── source-files/                  (60 .md files NST-SRC-001 → NST-SRC-060 equivalent — name them FC-SRC-001 etc)
│   └── client-data-corpus.jsonl       (400 chunks; use the Meridian JSONL shape: id/title/text/source_file_id/tenant_id/dataclass/last_updated/depth_score)
├── 99-verification/
│   └── expected-sentinel-answers.json (16 questions — see Packet 20 §6)
└── manifest.yaml
```

**Critical constraints:**
- Tenant key in chunks MUST be `tenant_id: 'arcturus'` (the canonical app ClientKey) — even though display name is "First Capital Financial" / "Brindlemark Financial Group" in the prod `clients` table.
- All forbidden terms list from Packet 20 §2 applies (no real Truist/PNC names, no real CEO names).
- Chunks must contain First-Capital-grounded statements, not generic financial services patterns. Example good chunk:
  ```json
  {"id":"FC-CHUNK-001","source_file_id":"FC-SRC-001","tenant_id":"arcturus","title":"BSA/AML Consent Order remediation status","text":"First Capital Financial is in active BSA/AML Consent Order remediation under FRB supervision. Lead: Marcus Blythe (CCO). Multi-year program with quarterly reporting; NICE Actimize SAM transaction monitoring is being rebuilt; ComplyAdvantage Copilot pilot underway in 95-investigator SAR workflow.","dataclass":"confidential","last_updated":"2026-04-30","depth_score":9}
  ```
- 16 verification questions in `99-verification/expected-sentinel-answers.json` MUST be from Packet 20 §6 (the BSA/AML question, the tariff scenario question, the CCAR prep question, etc.).

**Then run the loader:**
After authoring, hand back to Claude OR run yourself:
```bash
TENANT_KEY=arcturus npx tsx scripts/seed/load-tenant-substrate.ts --only-chunks
```
(Loader already supports `arcturus` once the dataset is in place — confirm `TENANT_PROFILES` entry exists; if not, add: `clientId: 'a75687bf-71b9-4524-ab4e-68ae3f28d200', tenantKey: 'first-capital', datasetRoot: 'datasets/firstcapital-financial-synthetic-v1', sourceFilesDir: '13-context/source-files', corpusJsonl: '13-context/client-data-corpus.jsonl'`.)

**Cost estimate:** ~$0.85 OpenAI embedding fees (400 chunks).

**Success criteria:** `node scripts/audit/db-substrate-audit.mjs` shows First Capital `enterprise_context_chunks` at 400/400.

---

## Stream E — Loader Phase 4 + 5 (ai_initiatives + vendor_contracts)

**Why this matters:** Phase 2 chunks alone get Sentinel grounded. But Phase 4 (initiatives) + Phase 5 (vendor_contracts) enable the structured surfaces in Source / Tower / Moves modules. Without them, those modules render empty for non-Apex tenants.

**Build target:** extend `scripts/seed/load-tenant-substrate.ts` to load:

- **`ai_initiatives` table** (25-column schema, see prod schema probe results in PR #2356):
  - Maps to `initiatives-active.csv` + `initiatives-closed.csv` in each tenant dataset
  - Key columns: `initiative_id`, `client_id`, `display_id`, `name`, `description`, `stage`, `owner_name`, `committed_annual_usd`, `committed_total_usd`, `status_flag`, `aligned_callout`, `aligned_rationale`
  - `primary_category_id` + `secondary_category_id` are FKs to a categories table — leave NULL if no match (loader logs warning, doesn't fail)
  - `primary_goal_id` is also an FK — same treatment
  - `loaded_via_template` should be `'packet-24-loader'`

- **`vendor_contracts` table** (23-column schema):
  - Maps to `vendor-contracts.csv`
  - Key columns: `vendor_name`, `contract_name`, `contract_category`, `scope_summary`, `annual_contract_value_usd`, `start_date`, `end_date`, `renewal_date`, `concentration_pct`, `rate_card_vintage`, `outcome_based`
  - `vendor_id` is FK to `vendors` table — for synthetic data, skip the FK and leave NULL (or insert vendor rows first if Codex wants to be thorough)
  - `ai_usage_clauses` is a JSONB; capture from CSV if present, else `{}`
  - Date columns: parse ISO from CSV; if missing, use `null`

**Probe-and-map pattern** (matches Phase 3 deployment_model approach):
1. Insert one probe row → see what CHECK constraint says
2. Walk through dataset values → map to accepted values
3. Add a `mapCriticality`-style helper per column

**Success criteria:**
- `npm run dry-run` shows N initiatives and M contracts detected per tenant
- Live run for Northstar inserts 80 active + 25 closed initiatives + 90 vendor contracts
- Substrate audit shows Northstar `ai_initiatives` ≥ 80, `vendor_contracts` ≥ 90
- Then loop for Meridian (28 active / 14 closed initiatives / 50 contracts) and Apex (top-up to 30 initiatives / 45 contracts)

**Out of scope:**
- `applications` table — Phase 3 already shipped (deployment_model mapper); Codex doesn't need to redo
- `enterprise_context_source_files` table — Phase 1 skipped permanently due to UUID FK constraint
- Embeddings — only chunks get embedded; initiatives/contracts are flat inserts

---

## Stream F — Apex backfill + cross-tenant integration test

**Why this matters:** Apex has 280 chunks but only 9 of 120 applications, 8 of 30 initiatives, 25 of 45 vendor contracts. That's the inverse of the other tenants — Apex's grounding chunks are fine, but its structured tenant data is sparse. Sentinel queries that depend on `applications` / `ai_initiatives` (e.g. "what's our top 10 by criticality?") fall back to vertical patterns instead of named apps.

**Two pieces:**

### F.1 — Apex applications + initiatives + vendor contracts backfill

Run the loader (after Stream E lands the Phase 4/5 extensions) for Apex:
```bash
TENANT_KEY=apex npx tsx scripts/seed/load-tenant-substrate.ts --skip-chunks
```
(`--skip-chunks` skips Phase 2 since Apex's 280 chunks are already loaded.)

Expected post-load: Apex `applications` 120/120, `ai_initiatives` 30/30, `vendor_contracts` 45/45.

### F.2 — Cross-tenant integration test (the demo readiness gate)

New test file: `scripts/smoke/multi-tenant-sentinel-grounding.spec.ts`

For each of 4 tenant personas:
- `cio@apex-retail.example.com` → Apex
- `cdio@meridian-health.example.com` → Meridian
- `cio@firstcapital.example.com` → First Capital
- `cio@northstar-clinical.example.com` → Northstar

Run the same 6 grounding questions:
1. "What do you know about us? Give me your highest-confidence facts and where you're guessing."
2. "What are our top 5 applications by criticality?"
3. "What's our biggest in-flight initiative?"
4. "Who are our top 3 vendors by annual spend?"
5. "What's our most pressing regulatory exposure?"
6. "Don't answer with facts from any other tenant. What do you know about us?"

For each turn assert:
- Answer length > 500 chars
- No `sentinel_synthesis_misconfigured` flag
- No `AI egress denied` text
- No `synthesis is not configured` text
- The grounding regex for that tenant's vertical matches
- The wrong-tenant-terms regex returns zero matches

Output: 24 turns total. If all pass, ship the JSON summary + HTML report. If any fail, surface as a P0.

**Success criteria:** all 24 turns pass. The same harness shape as the existing full-module-stress runner but trimmed to grounding-only (skip the 80 route crawls).

**Out of scope:**
- Building new personas — they already exist in Clerk
- Touching the Sentinel reasoning path — purely a verification harness
- UI / admin/context-layer — that's Stream B's deliverable

---

## How to start each stream

| Stream | Worktree | Brief |
|---|---|---|
| D — First Capital substrate authoring | new branch off `main`, name `codex/firstcapital-substrate-pack` | This doc §Stream D + `docs/build/PACKET_20_FIRSTCAPITAL_SUBSTRATE_PROMPT.md` |
| E — Loader Phase 4+5 | new branch off `main`, name `codex/loader-phase-4-5` | This doc §Stream E + `scripts/seed/load-tenant-substrate.ts` (current state) |
| F — Apex backfill + integration test | new branch off `main`, name `codex/apex-backfill-cross-tenant-test` | This doc §Stream F (depends on E completing first) |

All three are merge-on-green eligible per standing pre-approval. Each touches different files — no expected conflicts.

---

## What's still in Claude's lane (Lane A)

- ✅ Northstar 720 chunks loaded
- ✅ Meridian 320 chunks loaded
- 🔄 Northstar Phase 3 apps load (in background) — verifies the deployment_model mapper
- 🔄 Meridian stress test (in background) — verifies grounding works for healthcare tenant
- Pending: Apex chunk reload + verify (after Meridian stress confirms pattern)
- Pending: ship loader update PR #2363

---

## Coordination

Once Stream D lands:
- First Capital substrate exists on disk
- Claude (or Codex) runs `TENANT_KEY=arcturus npx tsx scripts/seed/load-tenant-substrate.ts --only-chunks` — embeds 400 chunks (~$0.85)
- Substrate audit shows all 4 tenants ≥ 280 chunks
- All 4 tenants demo-ready on the grounding axis

Once Stream E lands:
- Loader handles 5 phases end-to-end
- Stream F's Apex backfill can run

Once Stream F lands:
- Cross-tenant integration test gates every future deploy
- Demo confidence is empirical, not hopeful

---

## Definition of done

The Northstar CXO demo on 2026-05-27 (or whenever it fires) opens with:
1. Sign in as `cio@northstar-clinical.example.com`
2. Open `/intelligence/ask`
3. Ask "What do you know about us?"
4. Get a substantive answer citing 720 loaded chunks
5. Open `/admin/context-layer`
6. See real ingestion stages, source files, embedding history — not the prior hardcoded mock
7. Click through to evidence-map — see the source-doc → chunk → embedding provenance trail

Streams D / E / F extend this same confidence to the other three composite tenants.
