# AbarVa · Design Package · README

**Version:** 1.1 · April 23, 2026
**Owner:** Anand Sundaram
**Purpose:** Master index of the design package. Every artifact listed here, in the order a Claude Code agent or designer should consume them. Start at the top; drop into detail as needed.

---

## The stack, at a glance

```
STRATEGIC      → page-strategic-purpose-definition.md      (why each page exists)
DESIGN         → page-wireframes-and-journey-maps.md       (how each page is built + integrity layer)
STRUCTURAL     → programs-seed-and-deliverable-generation  (seed portfolio + render tiers)
INTELLIGENCE   → intelligence-layer-pattern-design-pack    (the moat — 13 patterns)
COMPONENTS     → wireframe-component-library.html          (15 reusable primitives)
EXEMPLARS      → wireframe-*.html                          (6 full-fidelity page examples)
```

Five artifact tiers. Read them top-down before making a design decision.

---

## Tier 1 · Strategic (what and why)

**`page-strategic-purpose-definition.md`** — The charter. Seven pages, each with audience, strategic purpose, core functionality, impact measures, design character, relationships to other pages. Settled Tier-1 priority ranking for the next 30 days (Programs + Control Tower + Investor are Tier 1; Home + Intelligence Tier 2; Platform + Admin Tier 3).

- Read before any page design change
- If a change doesn't reinforce the declared purpose, it doesn't ship

---

## Tier 2 · Design (how each page is built)

**`page-wireframes-and-journey-maps.md`** — Wireframes + personas + journey maps + critical click paths + **integrity layer**. Block-level structural wireframes for all 7 pages with sub-views. Five personas (CXO/Maestro/Investor/Design Partner/Client Admin) with 8 journey maps. The Prat demo golden path, Anthology investor deep read, and Morrison end-to-end walkthrough specified click-by-click.

**Critical update in v1.1:** Part 0.5 (current-state-vs-aspirational content rules) and Part 7 (content authoring guardrails with unlock conditions). These are non-negotiable integrity gates for anything shipping on Home / Platform / Investor.

- Forbidden content list (customer logos, testimonials, fabricated MOUs, revenue numbers) with explicit unlock conditions
- Content unlocks tied to real events, not marketing decisions
- "Prat/Anthology test": *if the claim were scrutinized, what's the honest answer?*

---

## Tier 3 · Structural (seed + render contract)

**`programs-seed-and-deliverable-generation-enhancement-spec.md`** — The portfolio seed contract. 19 programs across 4 composite reference tenants with deliberate phase distribution. Archetype × phase × deliverable matrix (5 × 5 × 28). Three render tiers (Rich / Outline / Stub) with enforced criteria. Every deliverable declares a tier; every tier has a rendering standard.

- Matrix becomes `intelligence/seeds/archetype-phase-deliverable-matrix.json`
- Tenant portfolios become `intelligence/seeds/tenant-portfolios/{slug}.json`
- Stub is a first-class render state — not a 404, not "coming soon"

---

## Tier 4 · Intelligence (the moat)

**`intelligence-layer-pattern-design-pack-FULL.md`** — 13 patterns authored at spec-grade depth. 5 universal (Analytics Modernization, AI-Led PDLC, AI Governance, Vendor Sprawl, Use Case Portfolio) + 8 vertical (Healthcare ×2, Retail ×2, FinServ ×2, Energy ×2). Each pattern has the same 18-section structure (A-R): identity, classification, detection signals, diagnostic questions, causal structure, interventions, anti-patterns, vendor landscape, regulatory, observations, success measures, timeline, governance, sector variants, related patterns, plus graph/retrieval/prompting/rendering contracts.

- This is the moat evidence for investor diligence
- Supports Parts 4-6 (persistence design, operationalization, delivery order)

---

## Tier 5 · Components + Exemplars (the build reference)

### Component library (the primitives)

**`wireframe-component-library.html`** — 15 reusable primitives extracted from the Programs exemplar. Every subsequent page composes from these — they are the visual vocabulary of AbarVa.

01 Navbar · 02 Breadcrumb · 03 Mono label · 04 Meta chip · 05 Button · 06 Editorial callout · 07 Section card · 08 KPI card grid · 09 Pressure card · 10 Phase timeline · 11 Deliverable row · 12 Gate readiness banner · 13 Decision log entry · 14 Cross-link item · 15 Composite footer

Open in browser, right-click → View Source to copy any component's HTML and CSS.

### Exemplars (full-fidelity page references)

Each exemplar is a complete HTML page demonstrating a specific surface at production-grade fidelity. Open each in a browser to visualize.

**`wireframe-programs-page.html`** — Program page (Ambient Clinical Value Chain on Meridian). The canonical authenticated working surface. Phase timeline, deliverable inventory, decision log, pressure cards, cross-links, right sidebar.

**`wireframe-programs-index.html`** — Programs index for Apex Retail. 6 programs with deliberate phase distribution (P1: 1, P2: 1, P3: 1, P4: 2, P5: 1). Portfolio health strip showing "running work at every phase." Morrison marked hero program. Filter bar, phase mini-timelines per card.

**`wireframe-d17-morrison-decision-memo.html`** — Rich deliverable exemplar (D17 Decision Memo for Morrison). The Prat-critical page. Executive summary in Georgia serif 19px, 4-card KPI strip, recommendation body with inline evidence citations (E1-E7 superscript chips), data table with preferred suppliers highlighted, inline SVG chart (cumulative margin recovery 36mo with breakeven marker), decision log, 3 risks with mitigations. Sticky sidebar with section anchor nav, cross-links, evidence base, analogous programs. Tier badge "Rich." Print CSS.

**`wireframe-d25-stub-scheduled.html`** — Stub deliverable exemplar (D25 Outcome Attestation scheduled for Phase 5). Proves the Stub tier reads as dignified, not a "coming soon" placeholder. Teal scheduled banner with activation conditions, 4 trigger conditions with state badges (In progress / Not yet / Complete), 3 prerequisite deliverables, 6 structure preview items. Full navigation preserved so clicks don't dead-end.

**`wireframe-pattern-ambient-clinical.html`** — Pattern detail exemplar (Ambient Clinical Value Chain). The moat evidence for investor diligence. Hero thesis in pull-quote treatment, meta chip row, signature **value chain SVG diagram** (ambient central + 6 radiating streams with Meridian integration state overlay: Active / Partial / Not started), Part A Identity prose, Part C Detection (8 numbered signals), Part E Interventions (8 levers with success rates), Part I Observations (6 composite scenario cards). Sticky sidebar with section nav, applicable tenants, regulatory chips (HIPAA / Part 2 / RADV / Info Blocking), related patterns.

---

## What's in the package vs. what's not yet

### In the package ✓

- Strategic purpose charter (all 7 pages)
- Wireframes + journey maps + integrity layer
- Seed spec (19-program portfolio + matrix + tier contract)
- Intelligence pack (13 patterns full depth + persistence + operationalization + delivery order)
- Component library (15 primitives)
- 5 full-fidelity page exemplars

### Pending (next build cycle) ○

- **Home HTML exemplar** (Tier 2 priority; acquisition-facing)
- **Platform HTML exemplar** (Tier 3 priority; technical evaluator / investor)
- **Investor HTML exemplar** (Tier 1 priority for Anthology prep — next highest-leverage build)
- **Tower Control Room refined HTML** (matches Apr 22 screenshot + fixes flagged gaps: action button consistency, CONTRADICTIONS tooltip, filtered programs label)
- **Tower sub-surface exemplar** (Vendor Portfolio recommended — sets pattern for Shadow AI / Regulatory / AI Council / Model Inventory)
- **Intelligence library HTML** (pattern grid landing page; companion to pattern detail exemplar)
- **Admin HTML exemplar** (client-side, sidebar nav pattern, utility-grade)
- **In-regeneration state design** (what renders while Nexus regenerates a deliverable)
- **Maestro Intake Interface conversational flow** (front door of Programs; currently underspecified)
- **Mobile responsive passes** (component library is already responsive; exemplars need spot-checks)

---

## How to use the package

### For designers

1. Read `page-strategic-purpose-definition.md` first. Internalize the seven pages.
2. Read `page-wireframes-and-journey-maps.md` — personas are the most useful part for design work.
3. Open `wireframe-component-library.html` in a browser. Scroll through all 15 components.
4. Open the exemplar that matches the surface you're designing. Use it as the fidelity reference.
5. Before shipping, run the **integrity test** from Part 7 of the wireframes doc.

### For Claude Code agents

1. Read the strategic purpose doc for the target page.
2. Read the wireframe for the target page.
3. Read the integrity layer (Part 0.5 + Part 7 of the wireframes doc).
4. Open the relevant exemplar HTML. Extract components. Compose the target page.
5. Run the link crawler and integrity linter before PR.
6. For content authoring on Home/Platform/Investor, apply the forbidden content list and language audit rules.

### For Anand

- The package is the product's design canon. Every ad-hoc design decision gets the question: "does this belong in the canon, or does it supersede it?" If it's a one-off, document the exception. If it's a pattern, fold it into the canon.
- Exemplars update as the product evolves. The Programs index for Meridian should exist alongside the Apex version as soon as it's needed; same pattern, different tenant.
- The integrity layer is the non-negotiable gate. No exceptions for Home / Platform / Investor content until unlock conditions are met.

---

## Next-turn recommendations (in priority order)

1. **Investor HTML exemplar** — Anthology-ready polish; the package's highest-stakes external artifact; builds on every other exemplar.
2. **Tower Control Room refined HTML** — match the Apr 22 screenshot, fix flagged gaps, re-establish the CIO Monday-morning ambition.
3. **Tower Vendor Portfolio sub-surface HTML** — sets the pattern for the 4 remaining Tower sub-surfaces.
4. **Home HTML exemplar** — completes the acquisition-to-product arc.
5. **Intelligence library HTML** — completes the moat navigation path.

The chain of logic: Investor page is the single most scrutinized external artifact. Control Tower is the single most compelling internal artifact for Prat. Both must be at exemplar fidelity before either investor or design-partner conversations advance.

---

## Change log

**v1.1 · April 23, 2026**
- Added Part 0.5 (current state vs. aspirational content) and Part 7 (content authoring guardrails) to wireframes doc
- Fixed overclaims on Home, Platform, Investor wireframes + Journey 4.6 fabricated MOU
- Fixed strategic purpose doc ("composite clients" → "composite reference tenants"; data room "customer references" → "pipeline references where consented")
- Built component library (15 primitives)
- Built 5 page exemplars (Programs page, Programs index, D17 Rich, D25 Stub, Ambient pattern)
- Added tier badges to D17 code row
- Added inline evidence citations (E1-E7) to D17 recommendation prose
- This README

**v1.0 · April 22, 2026**
- Strategic purpose charter authored
- Wireframes + journey maps authored
- Programs seed + deliverable generation enhancement spec
- Intelligence layer pattern design pack (13 patterns)
- Programs page HTML wireframe

---

*End of design package README.*
