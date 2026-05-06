# Setup / Admin — Full Reference

**What this doc is:** One-stop brief covering what Setup/Admin IS, what currently exists in code,
what the design says it should be, and what the redesign needs to build.

**Status:** 2026-05-07 snapshot.

---

## 1 · What Setup/Admin IS

### The one-line position

Setup/Admin is **the tenant admin's control panel for the platform's intelligence substrate** —
where they load, manage, and monitor the enterprise data that makes every agent answer grounded
and auditable.

### The founding premise

Every AbarVa agent capability (Sentinel sourcing briefs, Atlas portfolio signals, Nexus program
recommendations) is only as good as the data behind it. Setup/Admin is where that data lives,
gets structured, and gets connected to the agents.

The promise: **a senior practitioner in 60 seconds can see**:

1. What data the platform has about their enterprise — by segment, with counts and freshness
2. What is **missing** and why it matters (gaps mapped to active programs)
3. Where any fact came from — provenance inline, always
4. What to upload **next** to strengthen the platform's reasoning

It is a **data flywheel**, not a file manager. The gap drives the upload. The upload strengthens
the reasoning. The better reasoning improves the next program decision.

### Front agent

**Steward** — governance-register voice. Precise, calm, control-plane oriented.

- What is configured / what is degraded / what needs re-auth
- What data classes are active / what approvals are pending
- Distinct from Sentinel (interpretive/synthesis), Nexus (program workflow), Atlas (portfolio)

### Route

`/admin` (canonical). `/setup` redirects there.

---

## 2 · Three-Layer Architecture

Everything in Setup is designed as **three layers as one artifact**. They cannot be built
independently.

```
┌──────────────────────────────────────────────────┐
│  LAYER 1 — Setup/Admin Surface  (Claude owns)    │
│  Segment table · Detail pages · Steward chat      │
└──────────────┬───────────────────────────────────┘
               │ ingest()
┌──────────────▼───────────────────────────────────┐
│  LAYER 2 — Dataset Content + Schema Validation   │
│  14 dataset families · Per-family ingestion       │
│  Apex Retail synthetic dataset (apex-data/)       │
└──────────────┬───────────────────────────────────┘
               │ persist()
┌──────────────▼───────────────────────────────────┐
│  LAYER 3 — Knowledge-Layer Integration           │
│  Postgres (RLS) · Graph nodes + edges            │
│  Vector embeddings · Evidence ledger             │
│  (Codex owns)                                    │
└──────────────┬───────────────────────────────────┘
               │ retrieve()
┌──────────────▼───────────────────────────────────┐
│  Agent reasoning (Nexus / Sentinel / Atlas)      │
│  Tenant-grounded mode · Provenance trail         │
└──────────────────────────────────────────────────┘
```

**Layer ownership:** Claude owns Layer 1 (surface). Codex owns Layers 2+3 (data + integration).
The seam is the ingestion contract — schema validation → persistence → graph → vector → status.

---

## 3 · The 12 Failure Modes

The design is failure-mode driven. Every surface element traces to preventing one of these.

### Surface failures (Layer 1)

| # | Failure mode | Prevention |
|---|---|---|
| 1 | Inventory shows what's there but not what's **missing** | Coverage column with expected-baseline comparison; gap-first surfacing |
| 2 | Counts without context (raw numbers, no interpretation) | Steward-voice top summary; expected-baseline parameterized per tenant archetype |
| 3 | Gaps visible but not actionable | Every gap has "fill this gap" click-through |
| 4 | Provenance buried (uploaded-by / when / source hidden in detail pages) | Provenance shown inline in segment table AND on every record |

### Dataset failures (Layer 2)

| # | Failure mode | Prevention |
|---|---|---|
| 5 | Synthetic data that smells synthetic (uniformly clean, no contradictions) | ~12% missing fields, contradictions, asymmetric depth deliberately designed in |
| 6 | Coverage that doesn't match real enterprise shapes | Tenant personality deliberate — Apex strong in customer/martech, weak in supply chain |
| 7 | Dataset depth that doesn't support four reasoning modes | Every family specifies which knowledge-layer artifacts it produces |

### Integration failures (Layer 3)

| # | Failure mode | Prevention |
|---|---|---|
| 8 | Data uploaded but not persisted in graph/vector | Ingestion contract requires graph + vector confirmation before "uploaded" status is set |
| 9 | Tenant isolation that doesn't survive a missing filter | Every table has tenant_key column + RLS; deliberate negative tests required |
| 10 | Provenance lost between upload and agent response | Every record carries source_doc, source_basis, uploaded_by, uploaded_at through the full chain |
| 11 | Stale data not flagged for re-review | Every record has last_reviewed; expiry thresholds per data type; stale counts surfaced in table |
| 12 | Cross-segment relationships invisible | Graph edges resolve system → owner, system → vendor, program → KPI, etc. |

---

## 4 · The 14 Dataset Families

The Setup/Admin landing table has **14 rows** — one per family. These are the canonical segments.

| # | Family | What it holds | Apex Retail baseline | Health at launch |
|---|---|---|---|---|
| 01 | Enterprise profile | Legal entity, industry, FY structure, strategic priorities, risk appetite | 1 profile doc | ● Complete |
| 02 | Org structure | Exec bench (~50 leaders), reporting lines, political map, change-failure record | 50 named leaders, 3–5 documented failures | ⚠ 2 vacancies |
| 03 | IT system landscape | ~80 systems (65 loaded), integration map (~16 of ~124), shadow IT | Deliberate gap: legacy POS/store-tech not yet inventoried | ⚠ 12 missing owners |
| 04 | IT financials | $87.4M IT budget, run/change/transform split, 30 contract renewals in next 24 months | Complete | ● Healthy |
| 05 | KPI dictionary | ~150 KPIs (50 loaded), including "claimed but not measured" flags | Deliberate gap: 100 KPIs not yet inventoried | ⚠ 8 unmeasured |
| 06 | Active program inventory | 4 programs: CDP (P3), CC AI (P1), AMS Consolidation (P2), Demand Forecasting (P0) | Complete — gateway to Programs surface | ● Healthy |
| 07 | Sourcing artifacts | RFPs, evaluation matrices, BAFO trackers, contracts, template registry | CDP and AMS active sourcing | ● Healthy |
| 08 | Program deliverables | Phase outputs — charters, ARB attestations, discovery packages, execution plans | 4 phase deliverables (one per program) | ● Healthy |
| 09 | Evidence ledger | ~412 items: claims, source docs, confidence, classification, caveats | Active — some stale and low-confidence items | ⚠ 47 stale, 12 low-confidence |
| 10 | Operating telemetry | Meeting notes, risk/action/decision log (~30 active items) | Active, refreshed frequently | ● Healthy |
| 11 | Vendor and contract | 28 vendor scorecards, clause inventory (MFN, exit terms, SLAs, audit rights) | Top 28 vendors — 4 renewals due in 90 days | ⚠ Renewals due |
| 12 | Compliance | SOX, PCI-DSS, CCPA/CPRA postures, ~10 audit findings | 6 control gaps, review 90 days overdue | ✕ Critical |
| 13 | Industry context | ~30 signals: M&A, regulatory shifts, vendor market changes, peer benchmarks | Auto-refreshed from connectors | ● Healthy |
| 14 | Cross-program signals | ~18 auto-derived signals: shared SMEs, system dependencies, contradictions | Auto-derived; 3 contradictions open | ⚠ Needs review |

---

## 5 · Surface Design — What It Should Look Like

### Landing page — segment table

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Apex Retail — Tenant Data Health                                          │
│                                                                            │
│ Coverage: 73%   Records: 1,847   Last upload: 1 day ago                   │
│                                                                            │
│ Steward: "Apex Retail has rich customer data and active program           │
│ inventory, sparse supply chain instrumentation, and 6 evidence items      │
│ flagged as stale. Three programs running with insufficient baseline."      │
└──────────────────────────────────────────────────────────────────────────┘

[ Segment Table: 14 rows ]
Each row: Segment name | Records | Coverage | Freshness | Health | Last reviewed | Actions
Clickable → detail page for that segment
```

**Column semantics:**
- **Coverage** = actual records vs expected baseline for this tenant archetype (not a raw count)
- **Freshness** = days since any record in this segment was updated
- **Health** = composite flag: Complete / Partial / Sparse + attention signals (stale, low-confidence, gap vs baseline)
- **Actions** = View / Update (admin), View (read-only roles)

### Segment detail page (template for all 14)

1. **Header** — segment name, expected baseline, current coverage score, last reviewed date + reviewer
2. **Health panel** — specific issues (gaps, stale items, conflicts, low-confidence), clickable to filter table
3. **Records table** — the actual records, with provenance column always present
4. **Add/update affordance** — segment-appropriate (file upload, structured form, connector trigger)
5. **Steward chat (segment-scoped)** — "Ask about your [segment name]"

### Three design scenarios (the promise in action)

**Scenario A — Sparse state (initial onboarding)**
Admin lands, sees 18% coverage. Clicks IT landscape row. Sees "Expected ~80 systems; you have 12."
Steward: "CDP-style programs need ~6–8 source systems. AMS Consolidation needs the full portfolio."
Admin uploads CSV. Graph nodes created, cross-segment edges resolved, coverage recalculated.

**Scenario B — Steady state (current Apex)**
73% coverage, 4 active programs. Admin asks Steward: "Which programs are running with insufficient baseline?"
Steward names 3 — with specific gaps: missing in-store CRM, unverified call-volume lineage, pending granularity decision.

**Scenario C — Regulatory exam**
Admin opens Compliance. 6 control gaps, review overdue. Asks Steward: "Pull together everything for an AI governance audit."
Steward composes cross-segment synthesis: AI Council, exec bench, operating telemetry, compliance posture, 23 evidence items — grounded across segments.

---

## 6 · Current State (What Is Actually Built)

### Routes

| Route | Status | Notes |
|---|---|---|
| `/admin` (landing) | **Exists** — partial | Three-Acts design (What we know / What we can reason / What changes on upload) |
| `/admin/connectors` | Exists | Fixture data |
| `/admin/connectors/[connectorId]` | Exists | Fixture data |
| `/admin/users` | Exists | Fixture data |
| `/admin/users-access` | Exists | Fixture data |
| `/admin/policies` | Exists | Fixture data |
| `/admin/data-trust` | Exists | Fixture data |
| `/admin/ai-initiatives` | **Wired** | Live write to Supabase via `/api/setup/initiatives` |
| `/admin/audit` | Exists | Fixture |
| `/admin/agent-readiness` | Exists | View model |
| `/admin/architecture` | Exists | Architecture canvas |
| `/admin/reasoning/*` | Exists (multiple) | Activity feed, alerts, artifacts, audit trail |
| `/admin/production-readiness` | Exists | View model |
| `/admin/cross-program-signals` | Exists | Component ready |

### Landing page components (already built)

| Component | What it renders |
|---|---|
| `SetupAdminLanding` | Three-Acts wrapper |
| `SetupActOne` | "What we know" — fact grid from 14 segments |
| `SetupActTwo` | "What we can reason" — capability nodes grid |
| `SetupActThree` | "What changes on upload" — gain previews |
| `DataLandscapeTable` | Segment table (14 rows) |
| `CrossProgramSignalsPanel` | Signal cards from Atlas |
| `SetupChatRail` | Steward chat (right rail) |
| `SetupAgentStrip` | Steward action strip |
| `SegmentDetailPage` | Detail template (used by segment routes) |

### Library (`src/lib/admin/`)

| File | Purpose |
|---|---|
| `setup-acts-registry.ts` | Content registry (Acts 1–3, capability nodes, gain previews) |
| `setup-data-broker.ts` | Reads inventory snapshot, cross-program signals, chunk stats from DB |
| `steward-setup-readiness.ts` | Steward control-plane read model |
| `agent-thread-types.ts` | Generalized thread/observation types (Wave 5) |
| `constants.ts` | `SETUP_LEAD_AGENT = 'Steward'`, `SETUP_PRODUCT_NAME = 'AbarVa Setup'` |

### API routes

| Route | Purpose |
|---|---|
| `POST /api/setup/initiatives` | Persist AI initiative records |
| `POST /api/admin/upload-dataset` | Dataset upload (25MB limit) |
| `GET /api/admin/evidence-quality-export` | Evidence quality export |
| `GET /api/admin/steward-stats` | Steward health stats |
| `GET /api/admin/production-readiness` | Production readiness data |

### What is NOT built

- **Live Steward runtime** — no model invocation exists; all surfaces are deterministic view-models
- **5 Setup specialists** — all planned, none wired (DataSourceReadinessChecker, IntegrationHealthMonitor, PermissionAuditor, GateApprovalRouter, AuditTrailComposer)
- **14-segment DB schema** — SET-1 (schema migrations for all 14 families + audit log + expected_baselines) not shipped
- **Ingestion pipeline** (SET-2 through SET-4) — schema validation → persistence → graph → vector — not built
- **Coverage score engine** — expected-baseline parameterization not implemented
- **Stale detection** — thresholds defined in design doc, not in code
- **Segment detail pages** — `SegmentDetailPage` component exists but routes for all 14 segments not wired

---

## 7 · Actors and Permissions

| Role | What they can do on Setup/Admin |
|---|---|
| **Tenant Admin** | Full read/write on all 14 segments. Configure expected baselines. Approve/reject agent write-back. View audit log. |
| **Program Initiator / SME** | Read on segments their programs need. Upload to specific segments (evidence, deliverables, KPI updates). Cannot configure baselines. |
| **Steward** (agent) | Read-only across all segments. Governance summaries. Surfaces gaps. Cites records by ID. |
| **Atlas** (cross-program agent) | Reads cross-segment data. Writes to segment 14 (cross-program signals). |

---

## 8 · The "Imagination Run Wild" Directive

The founder ask (2026-04-30): *"Super impactful. Stellar experience. Imagination run wild."*

The spine doc is correct but conservative — it describes a coverage inventory page. The directive is stronger than "render the spine doc." Directions worth pursuing:

1. **Data flywheel as central metaphor** — every gap has a visible "what changes if you fill this" preview. Before-and-after of platform reasoning, not before-and-after of file count.
2. **Steward as the page's voice from moment of landing** — not a chat button in the corner. A presence that opens the page by telling you what it found.
3. **Tenant personality reveal** — "Apex is strong in customer/martech, thin in supply chain — here's what your portfolio is asking of the thin areas right now."
4. **"What only AbarVa can tell you about your data"** — a panel that surfaces patterns Steward found across uploads: contradictions, dependency chains, program gaps that wouldn't be visible from any single file.
5. **Onboarding thread** — walks first-time tenant admins through the right upload sequence (not alphabetical-folders sequence): org structure → system landscape → KPI dictionary → evidence, in the order that most improves program reasoning.
6. **Live reasoning preview** — before you upload, show "CDP P3 currently has 3 missing source systems. If you upload IT landscape CSV now, it will close 2 of those gaps and enable 4 new pattern citations in the next briefing."

---

## 9 · The Slice Plan (SET-1 through SET-12)

| Slice | Scope | Failure modes | Status |
|---|---|---|---|
| SET-1 | Schema migrations: 14 segment tables + audit log + expected_baselines | Governance | Not started |
| SET-2 | Ingestion pipeline steps 1–2: schema validation + persistence + audit | #4, #9 | Not started |
| SET-3 | Graph indexing (step 3): nodes + edges per family | #8, #12 | Not started — Codex |
| SET-4 | Vector embedding pipeline: chunk → embed → persist → retrieve | #8, #10 | Not started — Codex |
| SET-5 | Surface landing: segment table with coverage/freshness/health columns | #1, #2 | Partial — table component exists, coverage score engine missing |
| SET-6 | Segment detail pages (per family) | #3, #4 | Partial — template component exists, 14 routes not wired |
| SET-7 | Steward chat (data-scoped, grounded) | #2, #11 | Not started — chat rail exists but no model invocation |
| SET-8 | Stale data detection + health flags | #11 | Not started |
| SET-9 | Cross-segment edge rendering in detail pages | #12 | Not started |
| SET-10 | Apex Retail dataset load (apex-data/) | #5, #6, #7 | **Complete** — all 14 families in apex-data/ |
| SET-11 | Meridian + First Capital datasets at moderate depth | #6 | Not started |
| SET-12 | Tenant isolation negative tests + provenance trail end-to-end | #9, #10 | Not started |

**Codex owns:** SET-3, SET-4 (graph + vector layers). Must coordinate on SET-1 schema before SET-2 starts.

**Claude owns:** SET-1 (DB schema), SET-2 (ingestion pipeline surface), SET-5, SET-6, SET-7, SET-8, SET-9.

---

## 10 · What Blocks the Redesign

Per the memory guideline: **write a detailed design spec (`SETUP-1_DETAILED_DESIGN.md`) and get it approved before any code ships.** Same discipline as INT-1/INT-2.

The redesign requires decisions on:
1. **Coverage score weighting** — equal per segment, or weighted by impact on active programs? (Recommendation: weighted by program impact)
2. **Primary upload path** — form vs connector vs CSV? (Recommendation: connector-primary where available, CSV fallback)
3. **Mobile behavior** — 14-row table on mobile? (Recommendation: collapse to 5 most-attention-needed)
4. **Steward voice timing** — opens proactively on landing, or user-triggered? (Recommendation: brief opener line on landing, full chat on demand)
5. **Layer 3 coordination with Codex** — ingestion contract seam (what Claude hands off to Codex's graph + vector pipeline)

---

## 11 · Key Files to Read Before Building

| File | Why |
|---|---|
| `docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md` | The full spine — 828 lines. Ground truth for all three layers. |
| `docs/build/SETUP_AUDIT_2026-05-06.md` | Current state audit — what's built, what's not, what's resolved. |
| `src/app/(maestro)/admin/page.tsx` | The current landing page server component |
| `src/lib/admin/setup-acts-registry.ts` | The current Acts content model |
| `src/lib/admin/setup-data-broker.ts` | Live DB reads for snapshot, signals, chunk stats |
| `src/components/admin/setup/SetupAdminLanding.tsx` | The current landing component |
| `src/components/admin/setup/DataLandscapeTable.tsx` | The segment table component |
| `docs/architecture/specialist-catalog.md` | The 5 Setup specialists (DataSourceReadinessChecker etc.) |

---

*End of reference. Generated 2026-05-07.*
