# Setup / Admin — Design Brief
**For:** Anand (founder review + decision session)
**Status:** Synthesis · 2026-05-07
**Purpose:** One document that explains what Setup/Admin is, what is built, what the "stellar" redesign entails, and what decisions are still open.

---

## 1 · The thesis in one paragraph

Setup/Admin is the surface where a senior tenant admin (CDO, CIO of staff) gives AbarVa's agents their grounding. Without it, Sentinel's answers are generic corpus patterns. With it, Sentinel says *"your CDP P3 has a vendor lock-in risk that specifically affects Vendor C — here's the clause in your 2024 contract and the three programs that share that exposure."* The page's job is to make that transformation visible, legible, and compelling — so the admin sees uploading their data not as setup friction but as activating capability.

**The page is a story, not a file manager.** Three acts top to bottom: what the platform already knows about you, what it can reason with that data, and what one more upload would unlock. The segment table is the *substrate* — accessible via "See the full inventory" at the bottom — but it is not the headline.

---

## 2 · What Setup/Admin IS and IS NOT

### IS
- The **data flywheel control panel** — the gap drives the upload, the upload strengthens the reasoning, the better reasoning improves the next program decision
- The surface where **agent grounding lives**: org structure, system landscape, KPIs, evidence, compliance, cross-program signals
- **Steward's domain** — governance voice, control-plane oriented, distinct from Sentinel (interpretive), Nexus (program workflow), Atlas (portfolio)
- A **14-segment inventory** organized across Foundations → Financials → Programs → Evidence → Compliance → Intelligence

### IS NOT
- A SaaS file manager (Dropbox / SharePoint vibes are the failure)
- An IT management console (Apptio, ServiceNow vibes are wrong)
- A generic admin panel (settings + users is a sub-section, not the identity)
- The place you go after everything is set up (it lives throughout the program lifecycle)

---

## 3 · The 14 Dataset Families

These are the rows in the segment table. Every agent capability traces to at least one of them.

| # | Segment | What it holds | Apex Retail state | Health |
|---|---|---|---|---|
| 01 | Enterprise profile | Legal entity, $4.2B revenue, industry, FY structure, 3-5 strategic priorities | Complete | ● |
| 02 | Org structure | 47 named leaders, reporting lines, political map, change-failure record | Partial — 2 vacancies | ⚠ |
| 03 | IT system landscape | 65 of ~80 systems, 16 of ~124 integrations, shadow IT | Partial — 12 missing owners | ⚠ |
| 04 | IT financials | $87.4M budget, run/change split, 30 contract renewals in 24 months | Complete | ● |
| 05 | KPI dictionary | 50 of ~150 KPIs; several flagged "claimed but not measured" | Sparse | ⚠ |
| 06 | Program inventory | 4 programs: CDP (P3), CC AI (P1), AMS (P2), Demand Forecasting (P0) | Complete | ● |
| 07 | Sourcing artifacts | RFPs, BAFO trackers, evaluation matrices, template registry | Active — CDP + AMS in flight | ● |
| 08 | Program deliverables | Phase deliverables: charter, ARB, discovery package, execution plan | 4 docs current | ● |
| 09 | Evidence ledger | 412 items: claims, source docs, confidence ratings, classification | 47 stale, 12 low-confidence | ⚠ |
| 10 | Operating telemetry | Meeting notes, risk/action/decision log (~30 active) | Active | ● |
| 11 | Vendor and contract | 28 vendor scorecards, clause inventory (MFN, exit, SLA, audit rights) | 4 renewals due in 90d | ⚠ |
| 12 | Compliance | SOX, PCI-DSS, CCPA/CPRA postures, ~10 audit findings | 6 control gaps, review overdue | ✕ |
| 13 | Industry context | ~30 signals: M&A, regulatory shifts, peer benchmarks | Auto-refreshed | ● |
| 14 | Cross-program signals | 18 auto-derived: shared SMEs, dependencies, contradictions | 3 contradictions open | ⚠ |

**Overall coverage for Apex Retail today: 73% across 1,847 records.**

---

## 4 · Three-Layer Architecture

Everything in Setup is three layers treated as one artifact. They cannot be designed in isolation.

```
┌──────────────────────────────────────────────┐
│  LAYER 1 — Surface                           │  ← Claude builds this
│  /admin landing · Segment detail pages        │
│  Steward chat · Upload affordances           │
└──────────────────┬───────────────────────────┘
                   │ ingest contract
┌──────────────────▼───────────────────────────┐
│  LAYER 2 — Dataset Content + Schema           │  ← Apex data is fully built
│  14 family schemas · Per-family ingestion     │    (apex-data/ directory)
│  Apex Retail synthetic dataset                │
└──────────────────┬───────────────────────────┘
                   │ persist contract
┌──────────────────▼───────────────────────────┐
│  LAYER 3 — Knowledge-Layer Integration        │  ← Codex builds this
│  Postgres (tenant-isolated RLS)               │
│  Graph nodes + edges                          │
│  Vector embeddings · Evidence ledger          │
└──────────────────┬───────────────────────────┘
                   │ retrieve
┌──────────────────▼───────────────────────────┐
│  Agent reasoning                              │
│  Nexus · Sentinel · Atlas · Steward          │
│  Tenant-grounded answers with provenance     │
└──────────────────────────────────────────────┘
```

---

## 5 · The 12 Failure Modes (what to prevent)

**Surface failures (Layer 1)**

| # | Failure | Prevention |
|---|---|---|
| 1 | Shows what's there, not what's missing | Coverage column vs expected baseline; gap-first framing |
| 2 | Counts without context | Steward-voice opener IS the page header, not a side panel |
| 3 | Gaps visible but not actionable | Every gap → one-click "Add this dataset" with capability preview |
| 4 | Provenance buried | Provenance inline in every fact card, every record row — naked from sentence 1 |

**Dataset failures (Layer 2)**

| # | Failure | Prevention |
|---|---|---|
| 5 | Synthetic data that smells synthetic | ~12% missing fields, real contradictions, asymmetric depth deliberately designed in |
| 6 | Uniform coverage (not shaped like real enterprises) | Apex strong in customer/martech, thin in supply-chain — deliberate personality |
| 7 | Data depth that doesn't support 4 reasoning modes | Every family specifies graph nodes, edges, embeddings, evidence artifacts produced |

**Integration failures (Layer 3)**

| # | Failure | Prevention |
|---|---|---|
| 8 | Data uploaded but not persisted in graph/vector | Ingestion contract: graph + vector confirmation required before "uploaded" status set |
| 9 | Tenant isolation missing | Every table: tenant_key column + RLS; deliberate negative tests at pilot |
| 10 | Provenance lost upload → agent response | Every record carries source_doc, source_basis, uploaded_by, uploaded_at through the full chain |
| 11 | Stale data not flagged | Freshness thresholds per data type; stale counts surfaced in segment table |
| 12 | Cross-segment relationships invisible | Graph edges: system → owner, system → vendor, program → KPI, etc. |

---

## 6 · What "Stellar" Means — The Design Directions

The spine doc describes a coverage inventory page (segment table + summary). The founder directive is stronger: **stellar, imagination run wild.** Six directions worth exploring:

### Direction 1: Steward opens the page with a synthesis
Not a chat button in the corner. From the moment the admin lands, Steward speaks:
> "I see Apex Retail as a $4.2B specialty retailer with 47 named executives. Your customer and martech instrumentation is rich. Supply-chain instrumentation is thin — and three of your four active programs are running with insufficient baseline data in exactly that area. Here's what I can reason about today, and what one upload would change."

This is the opener. It's a full paragraph of grounded intelligence, not a welcome banner.

### Direction 2: Capability unlock is the hero, not the file count
Instead of "you have 1,847 records," the headline is:
> "With today's data, Sentinel can cite 17 patterns for your active program archetypes, Atlas has detected 18 cross-program signals (3 contradictions open), and vendor lock-in risk for Vendor C is evidence-grounded across 28 contract clause references."

That's a capability map, not a count.

### Direction 3: Before/after reasoning preview on every gap
When the admin sees "KPI dictionary — Sparse," they click "What does uploading this unlock?" and see:

> **Today:** "Outcome measurement for CDP is unverified. Sentinel cannot attribute revenue impact."
> **After upload:** "Sentinel cites your outcome baseline KPI from the dictionary; CDP target shows 14% delta vs baseline. CC AI containment baseline locked."

Real, specific, named numbers. Not "upload this to improve AI reasoning."

### Direction 4: Tenant personality as the lead
Apex is not a generic enterprise. The page opens with a sentence that proves we know them:
> "Apex Retail's data profile shows strength in customer and martech — 65 systems loaded, 412 evidence items, 4 active programs. The thin zones: supply chain (12 of ~80 expected systems), KPIs (50 of ~150 expected), and compliance (6 control gaps, review overdue). Those thin zones are exactly where Demand Forecasting and AMS Consolidation are running."

That's personality, not a file count.

### Direction 5: The "what only AbarVa can tell you" panel
A dedicated section: patterns, contradictions, and dependencies that are only visible because the platform connects data across all 14 segments. Things the admin didn't know they had:
> "We found: Vendor C appears in both your CDP P3 and AMS Consolidation sourcing artifacts with overlapping renewal exposure. This creates a negotiation dependency the programs don't know about yet."

### Direction 6: Onboarding sequence (not alphabetical folders)
For a new tenant admin, the page doesn't say "load all 14 segments." It says:
> "Start here. Org structure and IT landscape first — those unlock decision rights and system context for every downstream reasoning. Then evidence ledger. Then KPIs. You'll feel the capability difference after each one."

---

## 7 · The Three Acts (current design, already in code)

The `/admin` landing is already structured as three Acts.

### Act 1 — "What we know about you today"
Sentinel-voice paragraph opener + fact card grid. Each card:
- Fact type label (ENTERPRISE / EXECUTIVES / ACTIVE PORTFOLIO / EVIDENCE DEPTH / etc.)
- Body: specific, grounded statement
- Source: segment name + last-reviewed days ago (clickable to segment detail)

### Act 2 — "What we can reason about"
Capability map (list-of-grouped, NOT a network graph). Four families:
- Pattern citations: which patterns can Sentinel cite for which program archetypes
- Cross-program signals: which contradictions / dependencies Atlas has detected
- Evidence-grounded Q&A: which topics have evidence depth; which are sparse
- Outcome measurement readiness: which programs have baselines locked

Each capability node: depth state (● grounded / ◐ partial / ○ missing), count, top 2-3 examples clickable to source records.

### Act 3 — "What changes when you upload more"
Gain entries ranked by program impact. Each entry:
- Dataset name + segment number
- **Today:** what Sentinel says now (specific)
- **After:** what Sentinel can say after upload (specific, same format)
- "Add this dataset →" affordance (stub → upload flow in SETUP-2)

**Coverage substrate** is accessible via "See the full inventory →" at the bottom — not the page headline.

---

## 8 · What Is Already Built

### Landing page (functional)

| Component | Status | Notes |
|---|---|---|
| `SetupAdminLanding` | ✅ Built | Three-Acts page composition |
| `SetupSentinelOpener` | ✅ Built | Steward-voice opener + stats bar |
| `SetupActOne` | ✅ Built | Fact cards grid, segment rollups |
| `SetupActTwo` | ✅ Built | Capability nodes (partial visual) |
| `SetupActThree` | ✅ Built | Gain entries + "Add dataset" stubs |
| `DataLandscapeTable` | ✅ Built | 14-row segment table, category groups, health badges, coverage bars |
| `SetupChatRail` | ✅ Built | Steward chat right rail |
| `SegmentDetailPage` | ✅ Built | Template: rollup ribbon + records table |
| `CrossProgramSignalsPanel` | ✅ Built | Atlas signal cards |
| `SetupRecentActivity` | ✅ Built | Activity feed |

### Data layer

| Layer | Status |
|---|---|
| `setup-acts-registry.ts` — typed content model | ✅ Built |
| `setup-data-broker.ts` — live DB reads | ✅ Built (reads `data_inventory_*` tables) |
| `steward-setup-readiness.ts` — Steward read model | ✅ Built |
| Apex Retail dataset (`apex-data/` — all 14 families) | ✅ Complete |
| DB substrate (`data_inventory_segments`, ingestion pipeline) | ✅ Exists (from Codex's prior track) |

### Routes

| Route | Status |
|---|---|
| `/admin` (landing — three Acts) | ✅ Active |
| `/admin/connectors` | ✅ Active (fixture) |
| `/admin/users`, `/admin/users-access` | ✅ Active (fixture) |
| `/admin/ai-initiatives` | ✅ **Live** — writes to Supabase |
| `/admin/audit`, `/admin/data-trust`, `/admin/policies` | ✅ Active (fixture) |
| `/admin/cross-program-signals` | ✅ Active |
| `/admin/reasoning/*` | ✅ Active (several routes) |
| `/admin/agent-readiness`, `/admin/architecture` | ✅ Active |

---

## 9 · What Is NOT Built

| Item | Gap | Blocks |
|---|---|---|
| **Live Steward model invocation** | No model calls exist. All data is deterministic view-models or fixture. | Requires connector layer to be live first (Wave 2 trigger) |
| **5 Setup specialists** | All planned, none wired | Wave 2 (post-connector) |
| **Coverage score engine** | Expected-baseline parameterization not implemented. Coverage scores are authored fixtures. | SET-1 DB schema |
| **Stale detection** | Freshness thresholds defined in design doc; no runtime check implemented | SET-8 |
| **Upload flow** | "Add this dataset" affordances stub out. No upload pipeline in the UI. | SET-2 / SET-3 |
| **Segment detail routes** | `SegmentDetailPage` component exists but `/admin/segments/<id>` routes not wired for all 14 | SET-3 |
| **Ingestion pipeline** | Steps 1–5 (schema validate → persist → graph → vector → status update) not built | Codex layers 2+3 |
| **Tenant isolation negative tests** | RLS exists, negative test suite not run | SET-12 |

---

## 10 · The Slice Plan Forward

### Layer 1 slices (Claude builds — can start now)

| Slice | What | Failure modes |
|---|---|---|
| **SETUP-1 polish** | Evaluate current three-Acts page against "stellar" standard. Tighten opener voice, upgrade capability map visual, make Today/After previews more specific and compelling. | #1 #2 #3 |
| **SETUP-2** | Coverage substrate at `/admin/inventory` — full 14-row segment table as a standalone route | #1 #4 |
| **SETUP-3** | Per-segment detail pages: `/admin/segments/<id>` wired for all 14 + upload flow stubs | #3 #4 |
| **SETUP-4** | Audit log viewer at `/admin/audit` (depends on audit log DB table from Codex) | Governance |
| **SETUP-5** | Live Steward model invocation — when ≥1 connector is live, Steward grounds answers in connector health + permission gaps | #2 #11 |

### Layer 3 slices (Codex builds — coordinate seam)

| Slice | What |
|---|---|
| **SET-1** | DB schema: 14 segment tables + audit log + expected_baselines |
| **SET-2** | Ingestion pipeline: schema validation → persistence → audit |
| **SET-3** | Graph indexing: nodes + edges per family |
| **SET-4** | Vector embedding: chunk → embed → persist → retrieve |
| **SET-8** | Stale detection + health flag updates |
| **SET-9** | Cross-segment edge rendering in detail pages |
| **SET-12** | Tenant isolation negative tests + provenance trail end-to-end |

**Coordination seam:** Claude's upload form sends data to an ingest API endpoint. Codex's pipeline picks it up from there. The seam is the `POST /api/admin/upload-dataset` endpoint (already exists, 25MB limit).

---

## 11 · Four Open Decisions (Need Founder Verdict)

These were documented in `SETUP-1_DETAILED_DESIGN.md §9` and are still open.

### D1 — Steward opener: stub voice vs live doctrine
The Steward-voice opener currently uses authored fixture text (placeholder librarian register).
- **Option A:** Keep authored fixture for SETUP-1; swap to live Steward model invocation when connectors land (Wave 2)
- **Option B:** Wire Steward to a grounded-on-fixture prompt now, so the opener is dynamic and responds to the actual data state without waiting for connectors

**Recommendation:** Option A for SETUP-1; Option B becomes SETUP-5 trigger.

### D2 — Act 2 capability families (4 proposed, may want different)
Current 4 families: Pattern citations, Cross-program signals, Evidence-grounded Q&A, Outcome measurement readiness.
- **Alternative families:** Vendor intelligence depth, Compliance posture grounding, Decision-rights completeness, Integration mapping depth

**Recommendation:** Ship current 4 at SETUP-1; iterate with real usage. The four cover the most visible value propositions.

### D3 — Act 3 gain entries (5–7 proposed)
How many gain entries to surface before "Show more"?
- 5–7 ranked by program impact means: KPI dictionary (gates 2 programs), IT financials (gates AMS), Compliance posture (gates P2 entry), IT landscape completion (65 → 80 systems), Vendor clause inventory

**Recommendation:** 5 by default; "Show all gaps →" expands to the full list.

### D4 — Capability map visual: list-of-grouped vs SVG constellation
- **List-of-grouped** (current): keyboard-navigable, no-JS, mobile-first, screen-reader-friendly
- **SVG constellation**: more visually striking, shows relationships between capabilities, but harder to make accessible and mobile-friendly

**Recommendation:** List-of-grouped for SETUP-1 (pilot-grade). SVG constellation as a visual enhancement in a post-pilot slice if usage data shows engagement gap. The relationships AbarVa needs to surface are hierarchical (family → capability → records), not graph-shaped — the list already communicates the structure.

---

## 12 · The "Stellar" Evaluation Test

A senior tenant admin (CDO or CIO of staff) should land on `/admin` and within 60 seconds be able to answer:

1. Does the platform know enough about my enterprise to give me a non-generic answer? → **Act 1**
2. What specifically can it tell me right now that I couldn't get from any other tool? → **Act 2**
3. What's the next thing I should do to make it smarter? → **Act 3**

And leave thinking: *"I haven't seen this before — this is the value I'm paying for."*

**The current page passes the structure test but not the pausing test.** The three Acts are wired. The fact cards cite source segments. The capability nodes exist. But the voice is not yet specific enough to make a practitioner pause. The Today/After previews are too generic. The opener reads like a product description, not like Steward has actually read your data.

**That is what the redesign targets**: making the content specific, named, and evidence-grounded enough to feel genuinely intelligent — not a template with tenant-name interpolation.

---

## 13 · Immediate Next Steps

**If you want to start with the UI polish (fastest visible win):**
1. Evaluate the current `/admin` page (have you seen it recently?)
2. Sharpen the Steward opener to be truly Apex-specific (name the programs, name the execs, name the thin zones)
3. Make the Today/After previews in Act 3 name actual programs and specific capability deltas
4. Upgrade the capability map visual — even as a list, the current rendering undersells the moat

**If you want to start with the data pipeline (foundational, Codex-coordinated):**
1. Coordinate SET-1 schema with Codex (14 segment tables)
2. Build the upload flow (form → validation → ingest endpoint)
3. Wire coverage score engine

**Recommended order:** UI polish first (visible in 1-2 days, shows the vision), data pipeline parallel with Codex.

---

## 14 · Key Files

| File | Purpose |
|---|---|
| `docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md` | Full spine doc — 828 lines, authoritative |
| `docs/build/intelligence/SETUP-1_DETAILED_DESIGN.md` | Layer 1 implementation spec — 778 lines |
| `docs/build/SETUP_AUDIT_2026-05-06.md` | Current state audit |
| `src/app/(maestro)/admin/page.tsx` | Landing page server component |
| `src/lib/admin/setup-acts-registry.ts` | Content registry + types |
| `src/lib/admin/setup-data-broker.ts` | Live DB reads |
| `src/components/admin/setup/SetupAdminLanding.tsx` | Page composer |
| `src/components/admin/setup/DataLandscapeTable.tsx` | 14-row segment table |
| `src/components/admin/setup/SegmentDetailPage.tsx` | Detail page template |
| `apex-data/` | Full Apex Retail synthetic dataset (all 14 families) |

---

*End of design brief. Generated 2026-05-07.*
