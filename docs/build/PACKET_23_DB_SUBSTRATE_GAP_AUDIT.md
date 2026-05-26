# Packet 23 — Database Substrate Gap Audit (2026-05-26)

**Status:** Critical finding. CXO-demo blocker for Northstar (and substantially for Meridian / First Capital).
**Trigger:** Architectural review requested a tenant control-plane / data-plane segmentation audit + ingestion traceability check. The follow-up question — "audit the actual datasets in the database" — surfaced this.

---

## The headline

Across the four composite tenants, **2,741 substrate rows are missing** from Supabase. The dataset files exist on disk under `datasets/` (Codex Packets 18, 19, 20, 21 shipped them) but the **ingestion never ran into Supabase for 3 of 4 tenants**.

Apex is the only tenant with corpus chunks loaded (280) — and even Apex has only 9 of the spec'd 120 applications.

This means:
1. **The Northstar CXO demo (target: $225K pilot + $750K/yr) cannot produce substantive Sentinel answers today.** Even with PR #2354's tenant-resolver fix deployed, Sentinel has zero Northstar facts to ground against.
2. **The `/admin/context-layer` "provenance UI"** that the user wanted to demo is reading from `northstar-read-model.ts` — **hardcoded mock values for "Upload Received → Classified → Parsed → Mapped → Validated → Committed → Available to Agents"**. The numbers (96 files, 7,820 facts, 7,636 committed) are static placeholders, not records of actual ingestion runs.
3. **The `/admin/context-layer/uploads` page** runs `runNorthstarContextIngestion` against a 3-row hardcoded CSV sample — a demo of the ingestion library primitives, not an actual ingestion of the 240-app real dataset.

The principle the user wanted ("trace back to the process of loading data") is sound. The library primitives Codex shipped (classifier, validator, schema-mapper, approval queue, commit, evidence-writer) are good. **What's missing is the loader that actually ingests the dataset files through that pipeline into Supabase, and the admin UI binding that reads from the real ingestion records instead of the hardcoded mock.**

---

## The numbers (2026-05-26)

```
table                                    apex     meridian      arcturus    northstar
enterprise_context_chunks               280/280       0/320         0/400         0/720
enterprise_context_source_files          42/42        0/48          0/60          0/96
applications                              9/120      16/140        10/180         0/240
ai_initiatives                            8/30        7/28          7/32          0/80
vendor_contracts                         25/45        0/50          0/70          0/90
teams                                  null/14     null/16       null/22       null/22
person_client_memberships                  67          37            35             5
```

**Gap totals:**

| Tenant | Rows missing | Most critical gap |
|---|---|---|
| Apex Retail | 167 | applications (9 of 120) |
| Meridian Health | 579 | enterprise_context_chunks (0 of 320) |
| Brindlemark / First Capital | 747 | enterprise_context_chunks (0 of 400) |
| **Northstar MedTech** | **1,248** | **everything (0 of every table)** |
| **Total** | **2,741** | |

Run yourself: `node scripts/audit/db-substrate-audit.mjs`.

---

## Root cause

Codex's Packet 21 (PR #2350) shipped:

| Asset | Status | What it does |
|---|---|---|
| `datasets/northstar-clinical-tech-synthetic-v1/` | ✅ shipped | 240 apps / 820 edges / 80 initiatives / 90 contracts / 3,400 roles / 720 chunks as flat CSV/JSON files |
| `src/lib/context-ingestion/{classifier, validator, schema-mapper, approval-queue, commit, evidence-writer}.ts` | ✅ shipped | Ingestion primitives — correctly designed |
| `src/app/(maestro)/admin/context-layer/*` | ✅ shipped | Admin UI surfaces |
| `src/lib/context-ingestion/northstar-read-model.ts` | ⚠️ MOCK | Hardcoded display values: `NORTHSTAR_INGESTION_STAGES = [{ stage: 'Upload Received', files: 96, ... }, ...]` — static placeholders |
| `src/app/(maestro)/admin/context-layer/page.tsx` | ⚠️ Reads mock | Renders from `NORTHSTAR_PROFILE` / `NORTHSTAR_INGESTION_STAGES` directly |
| `src/app/(maestro)/admin/context-layer/uploads/page.tsx` | ⚠️ Demo only | Runs `runNorthstarContextIngestion` on a hardcoded 3-row CSV string |
| **Northstar dataset → Supabase loader** | ❌ **MISSING** | No script ingests the real 240-app / 720-chunk dataset through the pipeline into the live `applications`, `ai_initiatives`, `enterprise_context_chunks`, etc. tables |

The same gap exists for Meridian (Packet 19 / PR #2348 scaffold) and First Capital (Packet 20 / PR #2347 spec). The Apex pack (Packet 18) has a partial loader at `src/scripts/setup-data/load-apex-retail-setup-data.ts` that put 280 chunks into Apex's `enterprise_context_chunks` but missed `applications` (9 of 120) and `ai_initiatives` (8 of 30).

---

## What this means for the upcoming Northstar CXO demo

**Before this fix lands:**
- Every Sentinel question against Northstar returns "I don't have your systems inventory loaded in what's been surfaced to me this session" or pattern-matches against generic medtech vertical knowledge
- The `/admin/context-layer` UI shows impressive-looking provenance stages but the numbers are static fiction — auditing CXO will see this as soon as they cross-reference the UI with the database
- The 10x–50x pitch defended in PACKET_22_NORTHSTAR_INDUSTRY_PATTERN_OVERLAY.md cannot be demonstrated against actual Northstar data; the AMS rebid heatmap, tariff scenarios, SBOM gap report all require the substrate to be loaded

**After this fix lands:**
- Sentinel answers Q1–Q16 substantively citing named Northstar apps / initiatives / contracts
- The provenance UI reads from real ingestion records — every committed row has a source-file + classifier + validator audit trail
- The "trace back to the process of loading data" demand is satisfied end-to-end

---

## What needs to ship

### Packet 24 — Multi-tenant substrate loader (the actual fix)

Build `scripts/seed/load-tenant-substrate.mjs` parameterized by `TENANT_KEY={apex|meridian|arcturus|northstar}`. Same harness as the parameterized stress runner. For each tenant:

1. **Resolve client_id** from `clients` table via `CLIENT_KEY_TO_DB_SLUGS`
2. **Walk dataset directory** `datasets/<tenant>-synthetic-v1/`
3. **For each artifact** (CSV / JSON / JSONL / PDF / DOCX):
   - Compute sha256
   - Classify via `file-classifier.ts`
   - Parse via `extractors/*`
   - Map to schema via `schema-mapper.ts`
   - Validate via `validation-engine.ts`
   - Stage to approval queue via `approval-queue.ts`
   - Commit via `context-commit.ts` (writes to live tables: `applications`, `ai_initiatives`, `vendor_contracts`, `enterprise_context_source_files`, `enterprise_context_chunks`, `teams`, `org_roles`)
   - Write evidence rows via `evidence-writer.ts` linking source-file → committed rows
4. **For corpus chunks**: enqueue embedding generation through the AI Egress Control Plane (NOT inline a new provider SDK call)
5. **Print verification table**: actual row counts vs spec; exit nonzero if any gap

Optional `--dry-run` mode so the next time we run for a new tenant we can preview before mutating.

### Packet 25 — Real-data binding for the provenance UI

`src/lib/context-ingestion/northstar-read-model.ts` should be replaced with `src/lib/context-ingestion/tenant-read-model.ts` — a parameterized read-model that queries:
- `enterprise_context_source_files` for the file list
- `ingestion_run_history` (new table — needs migration) for stages + counts
- `evidence_ledger` for the source-file → committed-row provenance map
- `approval_queue` for staged-but-not-committed facts

`/admin/context-layer/page.tsx` and the subroutes consume this instead of the hardcoded constants. When a CXO opens the page during the demo, they see real numbers tied to their actual upload history.

---

## Auto-fix decision

These two packets are real engineering work (estimated 1–2 days of Codex execution). They are **NOT** safely auto-fixable in the same loop as STRESS-P0-008. Two reasons:

1. **Embedding costs.** Loading 720 Northstar + 400 First Capital + 320 Meridian + ~70 Apex-delta corpus chunks costs ~$3–8 in OpenAI embedding fees. Small but real and worth a user-eyes confirmation.

2. **Schema risk.** The loader needs to be defensive about column shape across tables. If `applications.column` has a NOT NULL constraint Codex didn't anticipate, the loader fails halfway and we have partial state to clean up.

Therefore: this packet is shipped as **documentation and audit tooling only**. The user reads this, decides whether to proceed, and either:
- Hands the loader to Codex with this packet as the brief, OR
- Approves me to write + run the loader in the next session with explicit guardrails

---

## What was auto-fixed today

- **STRESS-P0-008** (tenant resolver — `active-client.ts` missing `northstar` slug entry) ✅ merged in PR #2354
- **Scorer hardening** (`sentinel_synthesis_misconfigured` detector + word-boundaried grounding regex + canned-template min-length) ✅ merged in PR #2354
- **Provisioning-script Northstar regex** ✅ merged in PR #2354 (and already used to mint 5 Northstar Clerk users)
- **Control-plane tenant-purity scanner** + baseline 1,151 + Northstar-zero hard floor ✅ merged in PR #2354
- **Database substrate audit script** `scripts/audit/db-substrate-audit.mjs` ← this PR

## Out of scope for this PR

- Building the substrate loader (Packet 24) — needs explicit user go-ahead
- Building the real-data provenance UI binding (Packet 25) — same
- Backfilling Apex / Meridian / First Capital substrates — same. (Apex partially loaded; the other two are zero except memberships.)
- Task #17 (third-generation tenant-bleed via `ai_egress_audit`) remains open.

---

## Decision point for the user

**Question:** before the Northstar CXO demo, do you want:

(a) **Real substrate loaded** — Codex authors `scripts/seed/load-tenant-substrate.mjs`, runs it for all 4 tenants, embedding pass through AI Egress Control Plane, provenance UI rebound to live data. Estimated 1–2 day Codex sprint. Demo shows real numbers everywhere.

(b) **Demo-ready mock plus partial real load** — keep the current `/admin/context-layer` mock UI for the provenance walkthrough (CXO won't audit it), but at minimum load the 720 Northstar corpus chunks via a quick targeted script so Sentinel can ground in the substrate. Estimated half-day Codex sprint. Demo shows substantive Sentinel answers, provenance UI is a polished story not a real ledger.

(c) **Walk it back** — present the platform as it stands. Sentinel honestly confesses missing substrate ("I don't have your systems inventory loaded"). Demo focuses on the agent's grounding honesty and the value of the upcoming loader, not on substantive Northstar facts.

Option (a) is the right answer for a $225K + $750K commit-defensible demo. Option (b) is a fallback if Codex bandwidth is tight. Option (c) is the honest fallback that preserves credibility but doesn't earn the deal.

---

## Cross-reference

- Audit script: `scripts/audit/db-substrate-audit.mjs`
- Spec packets: `docs/build/PACKET_19_MERIDIAN_SUBSTRATE_PROMPT.md`, `docs/build/PACKET_20_FIRSTCAPITAL_SUBSTRATE_PROMPT.md`, `docs/build/PACKET_22_NORTHSTAR_INDUSTRY_PATTERN_OVERLAY.md`
- Dataset files: `datasets/{apex-retail,meridian-health,arcturus-financial,northstar-clinical-tech}-synthetic-v1/`
- Ingestion primitives: `src/lib/context-ingestion/*.ts`
- Admin provenance UI: `src/app/(maestro)/admin/context-layer/*`
- Read-model mock: `src/lib/context-ingestion/northstar-read-model.ts` ← contains the hardcoded mock values
