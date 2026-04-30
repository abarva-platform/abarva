# SETUP-1 — Setup/Admin Landing · Detailed Design Spec

**Slice:** SETUP-1 (Layer 1 surface track; first major slice of the
Setup/Admin redesign per founder directive 2026-04-30)
**Status:** Detailed design v1 — awaiting founder review
**Author:** Claude Opus 4.7 (with founder review)
**Date:** 2026-04-30
**Depends on:** Codex spine doc at
`docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md`
**Coordinates with:** Codex's parallel track on Layers 2 (datasets)
+ 3 (knowledge-layer integration)

> **Purpose of this document.** Implementation-grade spec for the
> redesigned `/admin` landing page. Spine doc Part D describes a
> coverage inventory page (segment table + detail pages); this
> spec extends the spine with the founder's "imagination run wild
> / stellar experience" directive. The thesis: **the page is a
> story about your enterprise, not a file manager.**
>
> **Scope discipline.** SETUP-1 ships ONLY the redesigned landing
> page at `/admin` rendered against fixtures (Apex Retail seeded
> data). Per-segment detail pages, upload flows, Sentinel chat
> data-scoped, and live tenant-data persistence are deferred to
> later sub-slices that depend on Codex's track landing.

---

## Part 1 — Premise

### 1.1 What's wrong with the conservative shape

The spine's Surface section (Part D) describes a 14-row table with
coverage / freshness / health columns + Sentinel-voice top
summary. That layout is correct doctrine — but it's a dashboard,
not an experience. A senior tenant admin (CDO, CIO of staff) lands
there and sees an inventory: 14 rows, percentages, health flags.
They can find what's missing. They can't *feel* what's possible.

The founder directive on top of the spine: **stellar. Imagination
run wild. The page where they land to setup their datasets and
experience has to be stellar.** That's a stronger ask than rendering
the spine. The page has to make a senior practitioner pause and
say "I haven't seen this before — this is the value I'm paying
for."

### 1.2 The redesign thesis

**The page is a story about your enterprise, not a file manager.**

Three acts the user reads top-to-bottom:

1. **What we know about you** — Sentinel introduces the platform's
   current understanding of the tenant. Concrete: "I see Apex Retail
   as a $4.2B specialty retailer with 47 named executives, a
   heavyweight customer/martech footprint, and a thinner supply-chain
   instrumentation. Three programs are active, all in early phases."
2. **What that lets us reason about** — capability map. With current
   data, the platform can answer specific questions, ground specific
   patterns, detect specific contradictions. The user sees the moat:
   "Sentinel can cite [n] evidence items for vendor lock-in risk;
   it can walk pattern neighborhoods on CDP and AMS; it found 3
   contradictions across your portfolio you haven't seen."
3. **What changes when you upload more** — capability gain map. Not
   a punch list of missing files but a sequence of capability
   unlocks. "Upload your KPI dictionary and Sentinel can cite
   outcome attribution evidence for CDP. Upload your IT financials
   and Atlas can model run-rate impact of AMS consolidation."

Coverage table exists *behind* this narrative as a power-user
substrate, accessible via "see the inventory" affordance — but
it's not the headline.

### 1.3 Failure modes prevented at SETUP-1

The spine names 12 failure modes (4 surface, 3 dataset, 5
integration). SETUP-1 owns the surface failures and prevents them
through narrative + visualization rather than by surfacing more
detail in the table:

| # | Failure mode | How SETUP-1 prevents it |
|---|---|---|
| 1 | Inventory page that shows what's there but not what's missing | Act 3 (capability gain map) makes gaps the *next move*, not a complaint. |
| 2 | Counts without context | Act 1 IS context. The Sentinel-voice opener is the page header, not a side panel. |
| 3 | Gaps visible but not actionable | Each gap in Act 3 is a one-click "Add this dataset" affordance with a preview of capability gain. |
| 4 | Provenance buried | Per-record provenance shows in the substrate table; per-act narrative cites records by ID inline so provenance is naked from the first sentence. |

Plus the founder-directed mandate (cross-cutting, not a numbered
failure mode): **stellar experience.** The judgment criterion is
"a senior tenant admin pauses on first visit and says: I haven't
seen this before."

### 1.4 Pilot-readiness floor

SETUP-1 ships when ALL true:

- All three Acts render with substantive Apex Retail content
  (the seeded fixture from `apex-data/`).
- Capability map (Act 2) is visualized — not a bullet list — and
  is interactive (hover/click reveals which records ground each
  capability).
- Capability-gain map (Act 3) renders with at least 5 concrete
  unlocks per active program archetype, each with a clickable
  "what changes" preview.
- Coverage substrate accessible via "Inventory" affordance.
- Page works for cold-fixture-only state AND
  partially-loaded state (when Codex's persistence ships).
- Mobile renders gracefully (Acts collapse to vertical scroll).
- Telemetry events fire on all major affordances.
- WCAG 2.1 AA compliance.

---

## Part 2 — Functional requirements

Each requirement has a stable ID `SETUP-1-FR-NNN`.

### 2.1 Page rendering

- **`SETUP-1-FR-001`** Route `/admin` MUST render the redesigned
  landing page for any authenticated tenant admin.
- **`SETUP-1-FR-002`** Page MUST render the three Acts in order:
  Act 1 (What we know) → Act 2 (What we reason) → Act 3 (What
  unlocks).
- **`SETUP-1-FR-003`** Page MUST be server-rendered (RSC). Acts
  derive content from a typed registry that resolves against the
  active tenant's fixtures (Apex / Meridian / First-Capital) until
  Codex's persistence ships.
- **`SETUP-1-FR-004`** Page MUST work without JavaScript — Acts
  visible, link affordances functional, capability-map visualized
  with semantic HTML/CSS only (no canvas/WebGL).
- **`SETUP-1-FR-005`** Page MUST work in a "cold tenant" state
  (minimal data) by reshaping Act 1 to: "I don't know much about
  your enterprise yet. Start with these 3 critical uploads to
  unlock the platform's core reasoning." Act 2 and 3 then orient
  toward what's unlocked at each upload milestone.

### 2.2 Act 1 — What we know about you

- **`SETUP-1-FR-010`** Act 1 MUST open with a Sentinel-voice
  introduction in the librarian register from
  `docs/build/AGENT_VOICE_SENTINEL.md` (per INT-4 doctrine when
  it lands; a stub voice is acceptable until INT-4 ships).
- **`SETUP-1-FR-011`** Act 1 MUST render at least 6 enterprise
  facts:
  - Legal entity + industry classification
  - Revenue + employee bands
  - Strategic priorities (top 3-5)
  - Executive bench summary (count + key roles named)
  - Active program portfolio (count + archetypes)
  - Total evidence-ledger items + last-upload recency
- **`SETUP-1-FR-012`** Each fact MUST cite the source segment
  (e.g., "from Enterprise Profile · last reviewed 12 days ago")
  with a click-through to the segment detail (substrate).
- **`SETUP-1-FR-013`** When data is sparse (fewer than 3 segments
  populated), Act 1 collapses to a "tell us about your enterprise"
  variant.

### 2.3 Act 2 — What we can reason about (capability map)

- **`SETUP-1-FR-020`** Act 2 renders a visual **capability map** —
  NOT a bullet list — showing what the platform can reason about
  with the current data. Capability nodes link to the records that
  ground them.
- **`SETUP-1-FR-021`** Capability map MUST render at least 4
  capability families:
  - Pattern citations (which patterns can Sentinel cite for which
    program archetypes)
  - Cross-program signals (which contradictions / dependencies /
    overcommitments has the platform detected)
  - Evidence depth (which claims has Sentinel grounded; which need
    more)
  - Outcome measurement readiness (which programs have baselines
    locked; which don't)
- **`SETUP-1-FR-022`** Each capability node MUST be interactive
  (hover/focus reveals the records that ground it). Click navigates
  to the source.
- **`SETUP-1-FR-023`** Capability map MUST NOT use canvas/WebGL —
  semantic HTML/CSS only (SVG acceptable for layout). Required for
  no-JS fallback (FR-004).
- **`SETUP-1-FR-024`** Each capability MUST be tagged with one of
  three depth states: `grounded` (sufficient data), `partial`
  (data exists but thin), `missing` (no data — capability not
  available).

### 2.4 Act 3 — What unlocks when you upload more

- **`SETUP-1-FR-030`** Act 3 renders a **capability-gain map** —
  for each missing/partial dataset family, what specifically would
  the platform gain. NOT a list of missing files.
- **`SETUP-1-FR-031`** Each gain entry MUST name:
  - The specific dataset (e.g., "KPI dictionary, segment 05")
  - The capability gained (e.g., "Sentinel can cite outcome
    attribution evidence for CDP and AMS programs")
  - A "what changes" preview — concrete sample of how the
    platform's reasoning shifts (e.g., "Today: 'Outcome
    measurement is unverified.' After upload: 'Outcome attribution
    cites baseline KPI from your dictionary; CDP target shows X%
    delta.'")
- **`SETUP-1-FR-032`** Each gain entry MUST have a one-click
  "Add this dataset" affordance that opens the upload flow for
  that segment (deferred to SETUP-2 implementation; SETUP-1 stub
  routes to placeholder).
- **`SETUP-1-FR-033`** Gain entries MUST be ranked by impact —
  segments that gate active programs first.

### 2.5 Coverage substrate (the inventory table)

- **`SETUP-1-FR-040`** Coverage substrate MUST be accessible via
  an "See the full inventory →" affordance at the bottom of the
  page (after Act 3).
- **`SETUP-1-FR-041`** The substrate is the spine doc's 14-row
  segment table (Part D.1) rendered in collapsed form. Coverage,
  freshness, health flags per row.
- **`SETUP-1-FR-042`** Substrate MUST NOT be the page's primary
  content. The Acts above own primacy.

### 2.6 Activity feed (cross-cutting)

- **`SETUP-1-FR-050`** Page MUST render a sidebar/footer activity
  feed showing the last 10 data events (uploads, edits,
  cross-segment edges resolved, agent write-back proposals).
- **`SETUP-1-FR-051`** Each event MUST cite actor + timestamp +
  what changed.

### 2.7 Telemetry

- **`SETUP-1-FR-060`** On page load, emit `setup_landing_loaded`
  with `{ tenant_key, visitor_role, tenant_data_richness:
  'sparse' | 'partial' | 'rich', acts_rendered: number }`.
- **`SETUP-1-FR-061`** On Act 1 fact click, emit
  `setup_act1_fact_clicked` with `{ fact_type, source_segment }`.
- **`SETUP-1-FR-062`** On capability node hover (Act 2), emit
  `setup_capability_hovered` with `{ capability_id, depth_state,
  dwell_ms }`.
- **`SETUP-1-FR-063`** On capability node click, emit
  `setup_capability_clicked` with `{ capability_id, depth_state }`.
- **`SETUP-1-FR-064`** On gain entry click (Act 3), emit
  `setup_gain_clicked` with `{ gain_id, target_segment }`.
- **`SETUP-1-FR-065`** On "See the full inventory" click, emit
  `setup_inventory_drilled`.

---

## Part 3 — Non-functional requirements

### 3.1 Performance

- **`SETUP-1-NFR-001`** FCP <1.0s on Fast 3G.
- **`SETUP-1-NFR-002`** LCP <1.8s. LCP element is Act 1 opener.
- **`SETUP-1-NFR-003`** TTI <2.5s.
- **`SETUP-1-NFR-004`** Capability map renders without
  layout-shift (CLS <0.1).

### 3.2 Accessibility

- **`SETUP-1-NFR-010`** WCAG 2.1 AA conformance.
- **`SETUP-1-NFR-011`** Capability map nodes keyboard-focusable.
  Tab walks through them in reading order; Enter/Space activates.
- **`SETUP-1-NFR-012`** Capability map renders meaningfully
  without CSS (semantic HTML structure: nested `<ul>`s with
  `<a>` links; CSS adds visual layout).
- **`SETUP-1-NFR-013`** `prefers-reduced-motion` honored — no
  animated transitions on map node hover.
- **`SETUP-1-NFR-014`** Color contrast: ≥4.5:1 body, ≥3:1
  headings.

### 3.3 SEO + share

- **`SETUP-1-NFR-020`** Page is auth-gated (no SEO needed); meta
  description still authored for internal-link previews.

### 3.4 Authentication boundary

- **`SETUP-1-NFR-030`** Page is auth-gated to tenant admin role.
  Non-admin authenticated users get a "this page is for tenant
  admins" placeholder with a "Request access" link.
- **`SETUP-1-NFR-031`** Page renders the active tenant's data
  only. Tenant key resolved server-side via
  `getActiveClientRow()`.

---

## Part 4 — Wireframes (text-annotated)

### 4.1 Desktop layout (≥1024px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ AppRail (76px) │ AppTopBar — "Apex Retail · Setup"                          │
│                ├───────────────────────────────────────────────────────────┤
│                │                                                            │
│                │  PAGE HEADER ZONE — Sentinel-voice introduction            │
│                │                                                            │
│                │  ┌──────────────────────────────────────────────────────┐ │
│                │  │ Sn  Sentinel · Knowledge Librarian          [Active] │ │
│                │  │ ────────────────────────────────────────────────────  │ │
│                │  │                                                      │ │
│                │  │ "I see Apex Retail as a $4.2B specialty retailer    │ │
│                │  │  with 47 named executives. You have 4 active         │ │
│                │  │  programs and 412 evidence items in the ledger.     │ │
│                │  │  Customer and martech instrumentation is rich;      │ │
│                │  │  supply-chain instrumentation is thin. Three of    │ │
│                │  │  your four programs are running with insufficient   │ │
│                │  │  baseline data. Here's what I can reason about     │ │
│                │  │  today, and what one more upload would change."    │ │
│                │  └──────────────────────────────────────────────────────┘ │
│                │                                                            │
│                ├───────────────────────────────────────────────────────────┤
│                │                                                            │
│                │  ACT 1 — What we know about you                           │
│                │  [Cormorant Garamond, 22px serif heading]                  │
│                │                                                            │
│                │  ┌──────────────────────────────────────────────────────┐ │
│                │  │ ENTERPRISE                                            │ │
│                │  │ Apex Retail Group · Specialty retail · $4.2B revenue │ │
│                │  │ ~14,200 employees · FY ending January                 │ │
│                │  │ from Enterprise Profile · 12d                        │ │
│                │  │                                                      │ │
│                │  │ STRATEGIC PRIORITIES                                  │ │
│                │  │ • Margin recovery on owned-brand portfolio          │ │
│                │  │ • Customer experience modernization                  │ │
│                │  │ • Operational efficiency at store level              │ │
│                │  │ from Enterprise Profile · 12d                        │ │
│                │  │                                                      │ │
│                │  │ EXECUTIVE BENCH                                       │ │
│                │  │ 47 named · CIO Lynne Stratham · CDO Marcus Park · …  │ │
│                │  │ from Org Structure · 8d · 2 vacancies                │ │
│                │  │                                                      │ │
│                │  │ ACTIVE PORTFOLIO                                      │ │
│                │  │ 4 programs · 4 archetypes · earliest P0, latest P3  │ │
│                │  │ from Program Inventory · 1d                          │ │
│                │  │                                                      │ │
│                │  │ EVIDENCE DEPTH                                        │ │
│                │  │ 412 items · 47 stale · 12 low-confidence            │ │
│                │  │ from Evidence Ledger · 4d                            │ │
│                │  └──────────────────────────────────────────────────────┘ │
│                │  (5-fact card grid; 2 columns desktop, 1 mobile)          │
│                │                                                            │
│                ├───────────────────────────────────────────────────────────┤
│                │                                                            │
│                │  ACT 2 — What we can reason about                         │
│                │  [Capability map — visual]                                 │
│                │                                                            │
│                │  ┌──────────────────────────────────────────────────────┐ │
│                │  │  Pattern citations                                    │ │
│                │  │  ─────────────────                                    │ │
│                │  │  ● grounded · 17 patterns citable                    │ │
│                │  │     ▸ AI Use Case Portfolio                          │ │
│                │  │     ▸ Vendor Sprawl Rationalization                  │ │
│                │  │     ▸ … (15 more)                                     │ │
│                │  │                                                      │ │
│                │  │  Cross-program signals                                │ │
│                │  │  ────────────────────                                 │ │
│                │  │  ● grounded · 18 detected, 3 contradictions open     │ │
│                │  │     ▸ apex-cdp + apex-ams share Vendor C dependency  │ │
│                │  │     ▸ apex-cc-ai sponsor cadence gap (severity high) │ │
│                │  │     ▸ … (16 more)                                     │ │
│                │  │                                                      │ │
│                │  │  Evidence-grounded Q&A                                │ │
│                │  │  ───────────────────                                  │ │
│                │  │  ◐ partial · vendor lock-in evidence (28 items),     │ │
│                │  │     workflow-change evidence (sparse — 4 items)      │ │
│                │  │                                                      │ │
│                │  │  Outcome measurement readiness                        │ │
│                │  │  ──────────────────────────                          │ │
│                │  │  ○ missing · KPI dictionary not loaded; only 1 of 4 │ │
│                │  │     programs has baseline locked                     │ │
│                │  └──────────────────────────────────────────────────────┘ │
│                │  (capability nodes; click to drill into source records)   │
│                │                                                            │
│                ├───────────────────────────────────────────────────────────┤
│                │                                                            │
│                │  ACT 3 — What changes when you upload more                │
│                │  [Capability-gain map]                                     │
│                │                                                            │
│                │  ┌──────────────────────────────────────────────────────┐ │
│                │  │  ▸ Upload KPI Dictionary                              │ │
│                │  │     [Add this dataset →]                              │ │
│                │  │                                                      │ │
│                │  │     Today: "Outcome measurement is unverified."      │ │
│                │  │     After: "Outcome attribution cites baseline KPI   │ │
│                │  │     from your dictionary; CDP target shows X% delta.│ │
│                │  │     CC AI shows containment baseline locked."        │ │
│                │  │                                                      │ │
│                │  │     Gates these programs from advancing: apex-cdp    │ │
│                │  │     P3→P4, apex-cc-ai P1→P2                          │ │
│                │  │  ────────────────────────────────────────────────    │ │
│                │  │  ▸ Upload IT Financials                               │ │
│                │  │     [Add this dataset →]                              │ │
│                │  │     ...                                              │ │
│                │  │  ────────────────────────────────────────────────    │ │
│                │  │  ▸ Upload Compliance Posture                          │ │
│                │  │     ...                                              │ │
│                │  └──────────────────────────────────────────────────────┘ │
│                │  (gain entries ranked by program-impact)                  │
│                │                                                            │
│                ├───────────────────────────────────────────────────────────┤
│                │                                                            │
│                │  [See the full inventory →]                               │
│                │  (collapsed substrate; opens 14-row segment table)         │
│                │                                                            │
└────────────────┴───────────────────────────────────────────────────────────┘
```

**Activity feed** lives in a right rail (≥1280px) or below the
inventory affordance (mobile). Shows last 10 data events.

### 4.2 Capability map visual style

Capability map is **flat list of grouped capability families**,
NOT a network/graph diagram. Each family is a section. Each
capability inside is a card with:

- Depth state icon (●  grounded / ◐ partial / ○ missing)
- Capability name + count (e.g., "17 patterns citable")
- Top 2-3 examples (clickable links to source records)
- "Show all" affordance to expand to full list

Why list-of-grouped over network diagram: keyboard-navigable, no-JS
renderable, screen-reader-friendly, and the relationships AbarVa
needs to surface are hierarchical (capability family → specific
capability → grounding records), not graph-shaped.

### 4.3 "Cold tenant" variant (sparse data)

When tenant has fewer than 3 segments populated:

- Act 1 collapses to: "I don't know much about your enterprise
  yet. Start with these to unlock the platform's core reasoning."
- Act 2 hides; replaced with "What you'll be able to reason about
  after the first 3 uploads."
- Act 3 promotes to top — onboarding affordances.

### 4.4 Mobile layout (<768px)

Three Acts collapse to vertical scroll. Capability map stays as
list-of-grouped (already mobile-friendly). Activity feed moves
below the inventory affordance.

### 4.5 Tablet (768–1023px)

Acts 1, 2, 3 stack vertically. Activity feed in a right rail at
≥900px, otherwise below inventory affordance.

---

## Part 5 — State machine

```
┌──────────────────────────────┐
│ SETUP_LANDING (initial)      │
│ /admin                        │
│ Render Acts 1, 2, 3 +         │
│ inventory affordance          │
└──────────┬───────────────────┘
           │
   ┌───────┼───────────────────────────────────────────────┐
   │       │                  │                            │
   ▼ click ▼ click capability  ▼ click gain entry           │
┌─────────┐┌──────────────────┐┌─────────────────────────┐│
│ Act 1   ││ Capability       ││ Upload flow (SETUP-2;    ││
│ fact    ││ source records   ││ stub at SETUP-1)         ││
│ →       ││ →                ││ /admin/upload/<segment>  ││
│ segment ││ /admin/segments/ ││                         ││
│ detail  ││ <segmentId>/...  ││                         ││
└─────────┘└──────────────────┘└─────────────────────────┘│
                                                          │
   ┌──────────────────────────────────────────────────────┘
   │ click "See the full inventory"
   ▼
┌─────────────────────────────┐
│ Inventory substrate         │
│ /admin/inventory            │
│ 14-row segment table        │
│ (existing spine D.1 design) │
└─────────────────────────────┘
```

### 5.1 Persistence

- **URL state.** Top-level `/admin` route. Sub-routes are
  segment-detail / inventory / upload pages, each owned by
  later sub-slices.
- **No client-side state survives refresh.** Page is
  server-rendered each time; "first-visit vs return-visit"
  distinction is *content-shaped* by tenant data state, not by
  cookies (Codex's audit log can drive a "since last visit"
  query in a future enhancement).

### 5.2 Edge / error states

- **Tenant has no data at all.** Act 1 shows: "We don't have your
  enterprise profile yet. Start here." with a single "Upload
  enterprise profile" CTA. Acts 2 and 3 are deferred until enough
  data exists.
- **Tenant fixture missing for active client.** Server logs
  warning; renders the "no data" placeholder.
- **User is not tenant admin.** Render the
  "this page is for tenant admins" placeholder with a "Request
  access" link.

---

## Part 6 — Information architecture

### 6.1 URL structure

| URL | Surface | Owner |
|---|---|---|
| `/admin` | Setup landing (3 Acts) | **SETUP-1 (this slice)** |
| `/admin/inventory` | Coverage substrate (14-row table) | SETUP-2 (follows directly) |
| `/admin/segments/<segmentId>` | Per-segment detail page | SETUP-3 (depends on Codex's persistence) |
| `/admin/upload/<segmentId>` | Upload flow per segment | SETUP-3 |
| `/admin/audit` | Audit log viewer | SETUP-4 |
| `/admin/users-access` (existing) | User & access management | unchanged |
| `/admin/connectors` (existing) | Data connectors | unchanged |
| `/admin/policies` (existing) | Tenant policies | unchanged |

Existing `/admin/*` sub-routes (users-access, connectors,
policies, etc.) remain functional. SETUP-1 reshapes only `/admin`
landing; sub-routes are unchanged.

### 6.2 Capability node IDs

Each capability node has a stable id used in telemetry +
deep-links:

- `cap.pattern-citations`
- `cap.pattern-citations.<archetype>` (per program archetype)
- `cap.cross-program-signals`
- `cap.cross-program-signals.<signal-type>`
- `cap.evidence-grounded-qa`
- `cap.evidence-grounded-qa.<topic-area>`
- `cap.outcome-measurement-readiness`

### 6.3 Cross-references

- Act 1 facts → segment detail pages (SETUP-3)
- Act 2 capability nodes → grounding records or substrate
- Act 3 gain entries → upload flow (SETUP-3 stub)
- Inventory affordance → substrate (SETUP-2)

---

## Part 7 — Workflows

### 7.1 Workflow 1: First-time tenant admin lands on /admin

| Step | Owner | Action | Latency budget |
|---|---|---|---|
| 1 | Browser | GET /admin | — |
| 2 | Server | Auth gate; resolve tenant; load fixture / persistence (per Codex track) | 100ms |
| 3 | Server | Compose Acts 1, 2, 3 from registry against tenant data state | 50ms |
| 4 | Server | Stream RSC; FCP at Act 1 opener (Sentinel voice) | 800ms (FCP) |
| 5 | Browser | LCP at Act 2 capability map | 1.8s (LCP) |
| 6 | Client | Hydrate; emit `setup_landing_loaded` | 200ms post-FCP |

### 7.2 Workflow 2: Tenant admin clicks a capability node

| Step | Owner | Action | Latency |
|---|---|---|---|
| 1 | User | Click capability node | 0 |
| 2 | Client | Emit `setup_capability_clicked` | <50ms |
| 3 | Browser | Navigate to grounding records (if `grounded`) or upload flow (if `missing`) | <100ms |

### 7.3 Workflow 3: Tenant admin clicks "Add this dataset" on a gain entry

| Step | Owner | Action | Latency |
|---|---|---|---|
| 1 | User | Click "Add this dataset →" | 0 |
| 2 | Client | Emit `setup_gain_clicked` with target segment | <50ms |
| 3 | Browser | Navigate to /admin/upload/<segmentId> (SETUP-3 stub at SETUP-1) | <100ms |

---

## Part 8 — Component breakdown

### 8.1 New files

- **`src/lib/admin/setup-acts-registry.ts`** — typed
  `ActOneFact`, `CapabilityNode`, `CapabilityGainEntry` interfaces;
  fixture-driven content for Apex / Meridian / First-Capital
  tenants; helper accessors. Switches to live persistence calls
  when Codex's track lands.
- **`src/lib/admin/__tests__/setup-acts-registry.test.ts`** —
  validation suite (~25 tests).
- **`src/components/admin/setup/SetupLanding.tsx`** — page
  composition (server component).
- **`src/components/admin/setup/SetupActOne.tsx`** — "What we
  know" cards (server component).
- **`src/components/admin/setup/SetupActTwoMap.tsx`** —
  capability map (client; supports keyboard nav + telemetry).
- **`src/components/admin/setup/SetupActThree.tsx`** —
  capability-gain entries (client; click → upload stub).
- **`src/components/admin/setup/SetupSentinelOpener.tsx`** —
  Sentinel-voice page header (server; reads from registry).
- **`src/components/admin/setup/SetupActivityFeed.tsx`** —
  recent data events (server).
- **`src/components/admin/setup/SetupTelemetryBridge.tsx`** —
  client island; CustomEvents → PostHog.

### 8.2 Modified files

- **`src/app/(maestro)/admin/page.tsx`** — replaced with
  `<SetupLanding />` import. Existing content (if any) becomes
  the substrate at `/admin/inventory` (SETUP-2).

### 8.3 Files NOT touched

- Existing `/admin/*` sub-routes (users-access, connectors,
  policies, etc.) — unchanged.
- `src/proxy.ts` — `/admin` already auth-gated to tenant admin
  role; no change.

### 8.4 testid markers

- `setup-landing-page`
- `setup-sentinel-opener`
- `setup-act-one`
- `setup-act-one-fact-{factType}`
- `setup-act-two-map`
- `setup-act-two-capability-{capId}`
- `setup-act-three`
- `setup-act-three-gain-{gainId}`
- `setup-inventory-affordance`
- `setup-activity-feed`

---

## Part 9 — Open decisions

1. **Sentinel-voice opener — full doctrine or stub?** INT-4 hasn't
   shipped Sentinel voice doctrine yet. Lean: stub the opener with
   placeholder librarian-register text at SETUP-1; swap to INT-4's
   doctrine when it lands. The opener's structure (intro + facts
   + transition to Act 2) stays even when content is stubbed.
2. **Act 2 capability map — what counts as a "capability"?** I
   propose 4 families (pattern citations, cross-program signals,
   evidence-grounded Q&A, outcome measurement readiness). Founder
   may want different families. Lean: ship with 4; iterate.
3. **Act 3 gain entries — how many to surface?** Spine doc says
   ~14 segments. Ranking by program-impact, top 5-7 most-impactful
   gains is a good default. Lean: 5-7 at SETUP-1; user can
   "see all gains" affordance if more.
4. **Capability-map visual style.** I proposed list-of-grouped
   over network diagram. Founder may prefer a more visual/SVG
   constellation map. Lean: list-of-grouped at SETUP-1 (mobile,
   no-JS, a11y are easier); SVG enhancement is a follow-up
   slice if visual is preferred.
5. **Activity feed source.** When Codex's audit log lands, that's
   the source. At SETUP-1, fixture-driven activity events
   (showing "Lynne uploaded systems_inventory.csv 2d ago" etc.)
   are acceptable.
6. **Fixture vs live persistence at SETUP-1 ship.** Codex's track
   is parallel; at SETUP-1's first ship, persistence is likely
   not live. The registry MUST work against fixtures. When
   persistence ships, the registry's helpers swap from fixture
   reads to broker calls without touching component code.
7. **"Cold tenant" trigger threshold.** Spine says cold = fewer
   than 3 segments populated. Confirm 3 (or different threshold).
8. **Inventory substrate routing.** Should "See the full
   inventory" navigate to `/admin/inventory` (new route) or
   expand inline on `/admin`? Lean: separate route — keeps the
   landing page focused; substrate has its own URL for
   bookmarking.

---

## Part 10 — Acceptance criteria + test plan

### 10.1 Acceptance criteria for SETUP-1

- [ ] **AC-1** All three Acts render server-side with substantive
  Apex Retail fixture content.
- [ ] **AC-2** Sentinel-voice opener is in librarian register
  (stub acceptable until INT-4).
- [ ] **AC-3** Act 1 renders ≥6 enterprise facts, each citing
  source segment + last-reviewed.
- [ ] **AC-4** Act 2 capability map renders ≥4 capability families
  with ≥3 grounded examples per family (where data supports it).
- [ ] **AC-5** Act 3 renders ≥5 gain entries, each with
  "Today/After" preview + "Add this dataset" affordance.
- [ ] **AC-6** "Cold tenant" variant renders correctly when fixture
  is sparse (manually tested by editing fixture).
- [ ] **AC-7** All telemetry events fire on documented triggers.
- [ ] **AC-8** Lighthouse Performance ≥85, Accessibility ≥95.
- [ ] **AC-9** axe-core: zero a11y violations.
- [ ] **AC-10** Mobile (<768px) renders gracefully.
- [ ] **AC-11** Page works without JS (Acts visible, links
  followable).
- [ ] **AC-12** No regressions on `/admin/*` sub-routes.
- [ ] **AC-13** Open decisions §9 have founder verdict.

### 10.2 Registry validation tests

```ts
describe('Setup Acts registry', () => {
  it('every tenant key in fixture has Act 1 content', () => { ... });
  it('every Act 1 fact has source segment + last-reviewed', () => { ... });
  it('every capability node has stable id matching IA', () => { ... });
  it('every capability node depth state is valid', () => { ... });
  it('every gain entry has Today/After preview text', () => { ... });
  it('every gain entry target segment resolves', () => { ... });
  it('no registry content uses banned marketing language', () => { ... });
  it('fact source segments resolve to valid segment ids', () => { ... });
  it('capability map renders consistently for Apex/Meridian/First-Capital', () => { ... });
  // ...
});
```

### 10.3 E2E tests (`tests/e2e/setup-landing.spec.ts`)

- `/admin` cold load — all 3 Acts render
- Sentinel opener visible
- Capability nodes are keyboard-focusable
- "Add this dataset" navigates to upload stub
- "See the full inventory" navigates to inventory substrate
- Mobile viewport renders gracefully

---

## Part 11 — Sliced implementation plan

| Sub-slice | Scope | Owner | Blocks |
|---|---|---|---|
| **SETUP-1.0** | This document signed off; open decisions resolved | Founder review | All sub-slices below |
| **SETUP-1.1** | Setup acts registry + types + fixture content for Apex (full), Meridian (partial), First-Capital (sparse) | Claude (draft) + Founder (ratify) | SETUP-1.2 |
| **SETUP-1.2** | `SetupSentinelOpener` + `SetupActOne` + page reshape at /admin | Claude | SETUP-1.3 |
| **SETUP-1.3** | `SetupActTwoMap` capability map (the moat surface) | Claude | SETUP-1.4 |
| **SETUP-1.4** | `SetupActThree` + Activity feed | Claude | SETUP-1.5 |
| **SETUP-1.5** | Mobile + a11y polish | Claude | SETUP-1.6 |
| **SETUP-1.6** | PostHog telemetry wiring | Claude | SETUP-1.7 |
| **SETUP-1.7** | Inventory substrate route + E2E suite | Claude | SETUP-1 close |

Subsequent SETUP-N slices depend on Codex's track:

- **SETUP-2** — Coverage substrate at `/admin/inventory` (depends
  on Codex's audit log + segment tables)
- **SETUP-3** — Per-segment detail + upload flows (depends on
  Codex's ingestion pipeline)
- **SETUP-4** — Audit log viewer (depends on Codex's audit table)

---

## Part 12 — Migration from current state

Current `/admin` page exists with whatever shape it has today.
SETUP-1 replaces the landing rendering entirely. Existing
`/admin/*` sub-routes are unchanged.

---

## Part 13 — Reviewer instructions

Read in this order:

1. **Part 1 (premise + thesis)** — confirm the "story not file
   manager" framing.
2. **Part 9 (open decisions)** — verdicts needed:
   - D1: Sentinel-voice opener stub vs INT-4 doctrine
   - D2: Act 2 capability families (4 proposed)
   - D3: Act 3 gain entry count (5-7 proposed)
   - D4: Capability-map visual style (list-of-grouped proposed)
3. **Part 4 (wireframes)** — confirm layout matches the imagined
   stellar experience.
4. **Part 2 (FRs)** + **Part 3 (NFRs)** — flag missing or
   over-specified requirements.
5. **Part 7 (workflows)** — confirm flow.
6. **Part 10 (AC + test plan)** — contract for "done."

**The decision that decides whether SETUP-1.0 → SETUP-1.1 starts:**

- **D1 + D4 — opener stub policy + capability-map visual.** If
  you want the SVG constellation instead of list-of-grouped, that
  changes implementation timing significantly.

If the four decisions are settled, SETUP-1.0 closes and SETUP-1.1
starts.

---

**End of SETUP-1 Detailed Design Spec v1.**
