# Programs Seed & Deliverable Generation Enhancement Spec

**Version:** 1.0 · April 22, 2026
**Owner:** Anand Sundaram
**Status:** Authoritative spec for seed densification, deliverable generation per phase, and render fidelity guarantee
**Consumers:** Claude Code agents implementing seed + generator + routing; demo audit team

---

## 0 · Executive Summary

This spec closes three gaps in the current AbarVa demo surface:

1. **Programs-per-tenant are thin and phase-uneven.** Composite tenants today have 1-3 programs clustered in late phases. We need a portfolio where each tenant shows programs at varied maturities — one just initiated, one mid-diagnosis, one in delivery, one in outcome measurement — so the UI reads like a real running book of work, not a demo mock.
2. **No canonical archetype × phase × deliverable manifest.** We have 28 deliverables and 5 archetypes but no authoritative map declaring which deliverables land in which phase for which archetype. Without the manifest, seeds are ad hoc and render coverage is random.
3. **Render fidelity is inconsistent.** The demo risk is not "deliverable missing" — it is "Prat clicks something that renders broken, partial, or 404." Every deliverable must render at a declared fidelity tier with guaranteed navigation.

The spec is organized in four layers:

- **Part 1** — Archetype × Phase × Deliverable Manifest (the matrix)
- **Part 2** — Tenant Portfolio Seed Specs (one per composite tenant)
- **Part 3** — Render Fidelity Contract (Rich / Outline / Stub tiers with component specs)
- **Part 4** — Routing & Render Guarantee (URL patterns, cross-links, audit checklist)
- **Part 5** — Demo-Critical Subset (what must be Rich for Prat)
- **Part 6** — Implementation Order & Acceptance Criteria

**Demo gravity consequence:** The Apex Retail / Morrison Owned Brand Margin Recovery path needs every deliverable at Rich fidelity across all 5 phases. Meridian's hero program (Ambient Clinical Value Chain) needs Rich fidelity. Everything else lands at Outline minimum. Stubs are explicit and honest — they render a "scheduled for Phase X" state, not a 404.

---

## Part 1 · Archetype × Phase × Deliverable Manifest

### 1.1 · Archetypes (5)

| Code | Archetype | Description | Typical duration | Typical programs |
|---|---|---|---|---|
| ST | Strategic Transformation | Enterprise-scale change program. Heavy on strategy artifacts, governance, multi-workstream orchestration. | 12-24 months | Enterprise AI strategy, operating model overhaul, M&A integration |
| WA | Workflow Automation | Process-level automation with measurable throughput/cost outcome. | 3-9 months | Prior auth automation, claims processing, onboarding automation |
| PM | Platform Modernization | Technical stack or data platform modernization. | 6-18 months | Data platform modernization, legacy system retirement, cloud migration |
| AP | AI Product / Copilot Enablement | Building an AI product or copilot embedded in workflows. | 4-12 months | Sales copilot, clinical copilot, trader assistant |
| OO | Operational Optimization | Cost, margin, or efficiency optimization using AI intelligence. | 3-9 months | Owned brand margin recovery, vendor sprawl rationalization, demand forecasting |

### 1.2 · Phase framework (5 phases, hard gates)

| Phase | Name | Gate criterion | Primary output |
|---|---|---|---|
| 1 | Intake & Framing | Problem statement accepted; scope, sponsor, success metric agreed | Program charter |
| 2 | Diagnosis & Analysis | Current state characterized; root causes validated; hypothesis ranked | Diagnosis report |
| 3 | Design & Decision | Target state designed; intervention portfolio selected; CXO alignment | Decision memo |
| 4 | Build & Deliver | Interventions executed; milestones tracked; risks managed | Delivery artifacts |
| 5 | Outcome & Accountability | Outcomes measured; attribution validated; financial impact signed | Outcome attestation |

### 1.3 · Deliverables (28 canonical)

Anchored to the prior deliverables-full-spec. Each deliverable has a stable code. Listed below with the phase(s) they can appear in and the archetypes they apply to.

| Code | Deliverable | Typical phase | Applies to archetypes |
|---|---|---|---|
| D01 | Program Charter | 1 | ST, WA, PM, AP, OO |
| D02 | Stakeholder Map | 1 | ST, WA, PM, AP, OO |
| D03 | Success Metric Tree | 1 | ST, WA, PM, AP, OO |
| D04 | Intake Interview Synthesis | 1-2 | ST, WA, PM, AP, OO |
| D05 | Current State Process Map | 2 | WA, OO, AP |
| D06 | Current State Data & System Map | 2 | PM, AP, WA |
| D07 | Current State Financial Baseline | 2 | OO, WA, ST |
| D08 | Pain Point Register | 2 | WA, OO, AP |
| D09 | Root Cause Analysis | 2 | ST, WA, OO |
| D10 | Benchmark Comparison | 2 | ST, OO, AP |
| D11 | Hypothesis Backlog | 2-3 | ST, WA, PM, AP, OO |
| D12 | Estimation & Execution Roadmap | 3 | ST, WA, PM, AP, OO |
| D13 | Target State Architecture | 3 | PM, AP |
| D14 | Target State Operating Model | 3 | ST, OO |
| D15 | Intervention Portfolio | 3 | ST, WA, PM, AP, OO |
| D16 | Business Case | 3 | ST, WA, PM, AP, OO |
| D17 | Decision Memo for CXO | 3 | ST, WA, PM, AP, OO |
| D18 | Risk Register | 3-4 | ST, WA, PM, AP, OO |
| D19 | Delivery Plan & RACI | 4 | ST, WA, PM, AP, OO |
| D20 | Sprint / Milestone Artifacts | 4 | ST, WA, PM, AP, OO |
| D21 | Model / System Build Specs | 4 | PM, AP |
| D22 | Change Management Package | 4 | ST, WA, OO |
| D23 | Go-Live Readiness Assessment | 4 | WA, PM, AP |
| D24 | Outcome Measurement Plan | 4-5 | ST, WA, PM, AP, OO |
| D25 | Outcome Attestation Report | 5 | ST, WA, PM, AP, OO |
| D26 | Financial Impact Validation | 5 | OO, WA, ST |
| D27 | Dual-Ledger Reconciliation | 5 | ST, WA, PM, AP, OO |
| D28 | Lessons Learned & Pattern Contribution | 5 | ST, WA, PM, AP, OO |

### 1.4 · The Matrix

Read as: for an archetype in a phase, these deliverables are expected. `●` required, `○` optional, blank = not applicable.

| Deliverable | ST-P1 | ST-P2 | ST-P3 | ST-P4 | ST-P5 | WA-P1 | WA-P2 | WA-P3 | WA-P4 | WA-P5 | PM-P1 | PM-P2 | PM-P3 | PM-P4 | PM-P5 | AP-P1 | AP-P2 | AP-P3 | AP-P4 | AP-P5 | OO-P1 | OO-P2 | OO-P3 | OO-P4 | OO-P5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D01 Charter | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | |
| D02 Stakeholder Map | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | |
| D03 Success Metric Tree | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | |
| D04 Intake Synthesis | ● | ○ | | | | ● | ○ | | | | ● | ○ | | | | ● | ○ | | | | ● | ○ | | | |
| D05 Current State Process Map | | ○ | | | | | ● | | | | | | | | | | ● | | | | | ● | | | |
| D06 Current State Data/System | | ○ | | | | | ● | | | | | ● | | | | | ● | | | | | ○ | | | |
| D07 Current State Financial | | ● | | | | | ● | | | | | ○ | | | | | ○ | | | | | ● | | | |
| D08 Pain Point Register | | ● | | | | | ● | | | | | ○ | | | | | ● | | | | | ● | | | |
| D09 Root Cause Analysis | | ● | | | | | ● | | | | | ○ | | | | | ○ | | | | | ● | | | |
| D10 Benchmark Comparison | | ● | | | | | ○ | | | | | ○ | | | | | ● | | | | | ● | | | |
| D11 Hypothesis Backlog | | ● | ○ | | | | ● | ○ | | | | ● | ○ | | | | ● | ○ | | | | ● | ○ | | |
| D12 Estimation Roadmap | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | |
| D13 Target Architecture | | | ○ | | | | | ○ | | | | | ● | | | | | ● | | | | | | | |
| D14 Target Operating Model | | | ● | | | | | ○ | | | | | ○ | | | | | ○ | | | | | ● | | |
| D15 Intervention Portfolio | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | |
| D16 Business Case | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | |
| D17 Decision Memo | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | |
| D18 Risk Register | | | ● | ○ | | | | ● | ○ | | | | ● | ○ | | | | ● | ○ | | | | ● | ○ | |
| D19 Delivery Plan/RACI | | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | |
| D20 Sprint Artifacts | | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● | |
| D21 Build Specs | | | | ○ | | | | | ○ | | | | | ● | | | | | ● | | | | | | |
| D22 Change Mgmt | | | | ● | | | | | ● | | | | | ○ | | | | | ○ | | | | | ● | |
| D23 Go-Live Readiness | | | | ○ | | | | | ● | | | | | ● | | | | | ● | | | | | ○ | |
| D24 Outcome Measurement | | | | ● | ● | | | | ● | ● | | | | ● | ● | | | | ● | ● | | | | ● | ● |
| D25 Outcome Attestation | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● |
| D26 Financial Impact | | | | | ● | | | | | ● | | | | | ○ | | | | | ○ | | | | | ● |
| D27 Dual-Ledger | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● |
| D28 Lessons Learned | | | | | ● | | | | | ● | | | | | ● | | | | | ● | | | | | ● |

### 1.5 · Deliverable count per archetype

- **Strategic Transformation:** 18-22 deliverables across all 5 phases
- **Workflow Automation:** 17-20 deliverables (heavy P2-P4)
- **Platform Modernization:** 16-19 deliverables (heavy P2-P4, tech-anchored)
- **AI Product / Copilot Enablement:** 18-21 deliverables (balanced)
- **Operational Optimization:** 18-21 deliverables (heavy P2-P3 and P5)

This gives a predictable shape — every program page renders a consistent number of deliverable cards scaled to archetype.

---

## Part 2 · Tenant Portfolio Seed Specs

Each composite tenant receives a seed portfolio: a set of programs distributed across archetypes *and* across phase maturity. The portfolio is designed so that the UI always shows running work at every phase, not a cluster at one end.

### 2.1 · Apex Retail Group (demo gravity center)

**Tenant profile:** Composite retail tenant, $18B revenue, 1,200 stores, private label strategy under margin pressure. Primary demo surface. Prat's walkthrough runs here.

**Program portfolio (6 programs):**

| Code | Program name | Archetype | Current phase | Fidelity tier | Pattern link | Role in demo |
|---|---|---|---|---|---|---|
| APX-01 | **Morrison Owned Brand Margin Recovery** | OO | Phase 4 (Build & Deliver) | Rich | `owned-brand-margin-recovery` | **Hero program — golden path** |
| APX-02 | Demand Forecasting Modernization | OO | Phase 3 (Design & Decision) | Rich | `demand-forecasting-inventory-ai` | Secondary hero — exercises Phase 3 assets |
| APX-03 | Store Labor Optimization | OO | Phase 5 (Outcome & Accountability) | Outline | — | Shows completed program, outcome attestation tier |
| APX-04 | Digital Assortment Copilot | AP | Phase 2 (Diagnosis) | Outline | — | Shows mid-diagnosis state, Phase 2 deliverables |
| APX-05 | Supply Chain Control Tower | PM | Phase 1 (Intake & Framing) | Outline | `analytics-modernization` | Shows freshly-initiated program |
| APX-06 | Returns Fraud Detection | WA | Phase 4 (Build & Deliver) | Outline | `fraud-detection-modernization` | Shows cross-vertical pattern reuse (fraud pattern in retail context) |

**Phase distribution:** Phase 1: 1 · Phase 2: 1 · Phase 3: 1 · Phase 4: 2 · Phase 5: 1 → fully covered.

**Archetype distribution:** OO: 3 · AP: 1 · PM: 1 · WA: 1 → weighted toward OO (Apex's positioning) but all 4 categories represented.

**Morrison (APX-01) deliverable inventory at Rich fidelity:**
- Phase 1: D01 charter, D02 stakeholder map, D03 success metric tree, D04 intake synthesis (4 deliverables)
- Phase 2: D07 financial baseline, D08 pain point register, D09 RCA, D10 benchmark, D11 hypothesis backlog (5)
- Phase 3: D12 estimation roadmap, D14 target operating model, D15 intervention portfolio, D16 business case, D17 decision memo, D18 risk register (6)
- Phase 4: D19 delivery plan, D20 sprint artifacts, D22 change mgmt, D24 outcome measurement plan (4)
- Phase 5: stubs for D25, D26, D27, D28 (explicitly scheduled, "will activate on Phase 5 gate")

**Total deliverables across all 6 Apex programs:** ~75-85 deliverable instances. Morrison alone contributes ~19 Rich-tier. Others contribute Outline-tier at their respective current-phase coverage.

### 2.2 · Meridian Health System

**Tenant profile:** Composite integrated delivery network, 14 hospitals, 220 ambulatory sites, MA-heavy payer mix, $7.8B revenue. Beachhead vertical — healthcare positioning anchor.

**Program portfolio (5 programs):**

| Code | Program name | Archetype | Current phase | Fidelity tier | Pattern link | Role in demo |
|---|---|---|---|---|---|---|
| MRD-01 | **Ambient Clinical Value Chain Activation** | AP | Phase 3 (Design & Decision) | Rich | `ambient-clinical-value-chain` | **Hero program — healthcare anchor** |
| MRD-02 | Prior Authorization Automation | WA | Phase 4 (Build & Deliver) | Outline | `prior-authorization-automation` | Shows pattern in active build |
| MRD-03 | Clinical Documentation AI Governance | ST | Phase 1 (Intake & Framing) | Outline | `ai-governance-operating-model` | Shows freshly-initiated governance program |
| MRD-04 | Revenue Cycle AI Tool Rationalization | OO | Phase 2 (Diagnosis) | Outline | `vendor-sprawl-ai-tool-rationalization` | Shows cross-cutting pattern (vendor rationalization in healthcare RCM) |
| MRD-05 | Readmission Risk Model Refresh | OO | Phase 5 (Outcome & Accountability) | Outline | — | Shows completed outcome state |

**Phase distribution:** Phase 1: 1 · Phase 2: 1 · Phase 3: 1 · Phase 4: 1 · Phase 5: 1 → balanced across all phases.

**Archetype distribution:** AP: 1 · WA: 1 · ST: 1 · OO: 2.

### 2.3 · First Capital Financial (arcturus slug)

**Tenant profile:** Composite mid-size retail bank + wealth mgmt, $42B AUM, regional presence, ~14M customer relationships. Financial services vertical demonstration.

**Program portfolio (4 programs):**

| Code | Program name | Archetype | Current phase | Fidelity tier | Pattern link | Role in demo |
|---|---|---|---|---|---|---|
| FCF-01 | Fraud Detection Modernization | WA | Phase 3 (Design & Decision) | Outline | `fraud-detection-modernization` | Primary finserv pattern exemplar |
| FCF-02 | Customer Onboarding & KYC AI | AP | Phase 4 (Build & Deliver) | Outline | `customer-onboarding-kyc-ai` | KYC pattern active build |
| FCF-03 | Wealth Advisor Copilot | AP | Phase 2 (Diagnosis) | Outline | — | Shows Phase 2 deliverables for an AI product |
| FCF-04 | Commercial Lending Data Platform | PM | Phase 1 (Intake & Framing) | Outline | `analytics-modernization` | Shows freshly-initiated PM program |

**Phase distribution:** Phase 1: 1 · Phase 2: 1 · Phase 3: 1 · Phase 4: 1.

### 2.4 · Keystone Energy

**Tenant profile:** Composite integrated energy company — upstream + midstream + trading, ~6,000 employees, NERC CIP scope. Energy vertical demonstration.

**Program portfolio (4 programs):**

| Code | Program name | Archetype | Current phase | Fidelity tier | Pattern link | Role in demo |
|---|---|---|---|---|---|---|
| KST-01 | Commodity Trading AI Modernization | AP | Phase 3 (Design & Decision) | Outline | `commodity-trading-ai` | Primary energy pattern exemplar |
| KST-02 | Predictive Maintenance Modernization | AP | Phase 4 (Build & Deliver) | Outline | `predictive-maintenance-modernization` | Phase 4 active build, high-visual content |
| KST-03 | OT/IT Data Platform Convergence | PM | Phase 2 (Diagnosis) | Outline | `analytics-modernization` | Shows Phase 2 deliverables for PM archetype |
| KST-04 | Regulatory Reporting AI | WA | Phase 5 (Outcome & Accountability) | Outline | — | Shows Phase 5 outcome state |

**Phase distribution:** Phase 2: 1 · Phase 3: 1 · Phase 4: 1 · Phase 5: 1.

### 2.5 · Cross-tenant totals

- 19 programs seeded across 4 composite tenants
- Every phase (1-5) represented in at least 3 tenants
- Every archetype represented in at least 3 tenants
- 2 programs at Rich fidelity (Morrison APX-01, Meridian MRD-01 Ambient)
- 17 programs at Outline fidelity
- Estimated total deliverable instances seeded: ~280-320 (2 Rich programs contributing ~40 deliverables, 17 Outline programs contributing ~240-280 at lighter content density)

---

## Part 3 · Render Fidelity Contract

Every deliverable declares a fidelity tier. The tier determines required content density, component set, and visual treatment.

### 3.1 · Tier: Rich

**When to use:** Demo-critical path only (Morrison APX-01, Meridian MRD-01, and any other hero programs the pitch requires).

**Required components:**

1. **Executive summary block** — 80-120 words, anchored on outcome. Renders as a lead card with strong typography and pull quote.
2. **Structured KPI strip** — 4-6 metrics, numeric values with units, delta vs baseline, confidence interval where applicable. Horizontal card row on desktop; stacks on mobile.
3. **Data tables** — at least one real data table with tenant-specific values, sortable columns, exportable.
4. **Inline charts** — at least one chart (line, bar, or scatter) rendered with real seeded data. Chart.js or Recharts; consistent color tokens.
5. **Narrative body** — full prose with section headers (H2/H3), not bullets as a substitute for writing. 800-1,500 words body content.
6. **Decision log** — for deliverables in Phase 3+, a visible decision log showing the CXO-level decisions made, who decided, when, and the evidence link.
7. **Tenant-specific bindings** — every number, name, and reference is tenant-resolved. No placeholders.
8. **Breadcrumbs** — full breadcrumb chain: Home › Tenant › Program › Phase › Deliverable.
9. **Cross-links** — outbound links to: the source pattern (if applicable), related deliverables in the same program, analogous deliverables in other programs, relevant intelligence layer content.
10. **Print CSS** — Rich deliverables must render cleanly in print preview (Prat or a design partner will print).
11. **Provenance footer** — "Generated by Nexus on {date} · Grounded in {source_count} pieces of evidence · Last updated {timestamp}."
12. **Mobile treatment** — responsive; KPI strip stacks; tables become card lists; charts resize.

**Expected page length (desktop):** 4-8 scrollable screens.

### 3.2 · Tier: Outline

**When to use:** Default for non-hero programs. Programs at Phase 1-4 in all non-demo-critical tenants and secondary Apex programs.

**Required components:**

1. **Header block** — deliverable title, phase badge, program name, tenant, last updated.
2. **Executive summary paragraph** — 40-80 words. One paragraph, no KPI strip required.
3. **Section headers with body bullets** — all required sections present, body populated with real tenant-specific bullets (not lorem ipsum). Minimum 250 words of content across the deliverable.
4. **One data element** — either a small table (3-8 rows) or a summary list with structured data. No chart required but one is welcome.
5. **Tenant-specific bindings** — mandatory. Every placeholder must resolve.
6. **Breadcrumbs** — full chain.
7. **Cross-links** — at minimum: link to program page, link to source pattern if referenced. Bidirectional verification passes.
8. **Mobile treatment** — responsive; content flows; no horizontal scroll.

**Expected page length (desktop):** 2-4 scrollable screens.

**What Outline is NOT:** Outline is not a stub. The sections are populated with real content. It looks like a working draft that a consultant is iterating on — not a scaffold. The visual difference from Rich is the absence of charts, fewer KPIs, shorter narrative — not absence of substance.

### 3.3 · Tier: Stub (explicit scheduled state)

**When to use:** Deliverables that belong to a phase the program has not yet reached. A Phase 5 Outcome Attestation on a program currently in Phase 3 is a Stub.

**Required components:**

1. **Header block** — deliverable title, phase badge, program name, tenant.
2. **Scheduled banner** — prominent visible banner: "This deliverable activates when Program {name} reaches Phase {N}. Trigger: {specific gate criterion from Phase N}."
3. **Trigger conditions block** — explicit list of what must be true for this deliverable to generate. Includes any prerequisite deliverables that must exist.
4. **Expected structure preview** — a light section-header outline showing what the deliverable *will* contain when it activates. Helps reviewers understand the content surface without faking it.
5. **Breadcrumbs + cross-links** — full navigation preserved. User can navigate freely; no dead ends.
6. **No fake content** — no placeholder body prose, no dummy charts, no lorem-ipsum.

**Expected page length (desktop):** 1-1.5 scrollable screens.

**The Stub is a first-class render state.** It is not a 404. It is not "Coming soon." It is a deliberate, informative page that signals "this is real and scheduled" — and it proves the system's phase discipline to any reviewer who clicks on it.

### 3.4 · Tier assignment rules

- **Rich:** Explicitly declared in the seed spec for the hero program in each demo tenant.
- **Outline:** Default for all in-phase and completed-phase deliverables in non-hero programs. Also applies to all non-demo-critical deliverables in hero programs that aren't in the demo click-path.
- **Stub:** Automatic for any deliverable whose phase is ahead of the program's current phase.

The seed generator must emit the correct tier for each deliverable instance. The rendering layer must honor the declared tier strictly.

### 3.5 · Shared rendering standards (all tiers)

- **Design system consistency.** All three tiers use the same type scale, color tokens, spacing system, and component primitives. Fidelity differs in density and component choice, not in brand language.
- **Dark working zone compliance.** All deliverable pages render in the dark near-black working zone theme (not the light cream hero theme). Matches the established design language.
- **Accessibility.** All tiers meet WCAG 2.1 AA — contrast, focus states, semantic HTML, keyboard navigation, screen reader labels.
- **Performance budget.** First contentful paint ≤ 1.5s, largest contentful paint ≤ 2.5s on 3G Fast equivalent. Rich-tier pages may load charts lazily.
- **Composite disclaimer.** Every page footer carries the "composite organization built from real-world data" attribution chip.

---

## Part 4 · Routing & Render Guarantee

The goal: **every clickable element goes somewhere, and every destination renders correctly.** No 404s, no blank pages, no broken nav, no inconsistent breadcrumbs.

### 4.1 · URL pattern canonicalization

| Resource | URL pattern | Example |
|---|---|---|
| Tenant dashboard | `/tenant/{tenant_slug}` | `/tenant/apex-retail` |
| Tenant programs index | `/tenant/{tenant_slug}/programs` | `/tenant/apex-retail/programs` |
| Program page | `/tenant/{tenant_slug}/programs/{program_slug}` | `/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery` |
| Phase view on program | `/tenant/{tenant_slug}/programs/{program_slug}/phase/{phase_num}` | `.../phase/3` |
| Deliverable page | `/tenant/{tenant_slug}/programs/{program_slug}/deliverables/{deliverable_code}` | `.../deliverables/d12-estimation-roadmap` |
| Pattern page (intelligence layer) | `/intelligence/patterns/{pattern_slug}` | `/intelligence/patterns/owned-brand-margin-recovery` |
| Tenant-scoped pattern view | `/tenant/{tenant_slug}/intelligence/patterns/{pattern_slug}` | `/tenant/apex-retail/intelligence/patterns/owned-brand-margin-recovery` |
| Cross-tenant portfolio view (ops) | `/operations/portfolio` | |

Slugs are lowercase-kebab. No IDs in URLs unless necessary; slugs are canonical. Every slug is stable — renaming requires a redirect.

### 4.2 · Mandatory cross-link classes

Every Rich and Outline deliverable page must include these link classes, in order of importance:

1. **Breadcrumb up-chain** — Tenant › Program › Phase › Deliverable, all clickable.
2. **Previous / Next deliverable in phase** — lateral navigation within the same phase.
3. **Phase summary link** — link to the Phase view for this program.
4. **Program overview link** — link to the Program page.
5. **Related deliverables** — 3-5 links to related deliverables in the same program or archetype (e.g., D16 Business Case links to D12 Estimation Roadmap and D17 Decision Memo).
6. **Source pattern link** — if the deliverable was generated referencing an intelligence layer pattern, link to the pattern page.
7. **Cross-program analogues** — if the deliverable has analogs in other programs, link to those (this exercises the graph's ANALOGOUS_TO edges).
8. **Evidence links** — inline citations to the source evidence (interview synthesis, benchmark data, etc.), each clickable to the source artifact.

Stubs include: breadcrumb up-chain, previous/next in phase, phase summary, program overview, and the explicit "will generate at Phase N" link to the phase gate description.

### 4.3 · Render contract (hard)

Every route returns a render within the following contract:

- **200 OK** with a valid rendered page
- **Canonical `<title>`** matching breadcrumb chain
- **Canonical `<meta name="description">`** for SEO / preview cards
- **Open Graph tags** populated for share previews
- **Canonical breadcrumb structured data (schema.org/BreadcrumbList)**
- **No console errors** on page load
- **No broken images** (every img has a valid src)
- **All links lead somewhere** — no `href="#"` placeholders, no `onclick=""` stubs
- **Mobile viewport meta** present
- **Loads within performance budget** (Section 3.5)

Any route that cannot meet these must render the Stub state rather than fail.

### 4.4 · Audit checklist

Run as a pre-demo gate. Every item must pass.

**Level 1 — URL coverage**
- [ ] Every tenant has a dashboard route that renders
- [ ] Every tenant has a programs index that lists all seeded programs
- [ ] Every program has a program page that renders
- [ ] Every program has phase views for all 5 phases (including stubs for phases not reached)
- [ ] Every deliverable in every program has a deliverable page that renders at its declared tier
- [ ] Every intelligence layer pattern referenced in any program has a pattern page that renders
- [ ] Every tenant-scoped pattern view renders correctly

**Level 2 — Cross-link integrity**
- [ ] Every breadcrumb chain is clickable and each link resolves to a 200
- [ ] Every "next/previous in phase" link resolves to a 200
- [ ] Every "related deliverables" link resolves to a 200
- [ ] Every "source pattern" link resolves to a 200
- [ ] Every "cross-program analogue" link resolves to a 200
- [ ] Every evidence citation link resolves to a 200 (or to a graceful "evidence restricted" page)

**Level 3 — Render quality**
- [ ] Every Rich-tier page has: executive summary, KPI strip, data table, chart, narrative body, decision log (Phase 3+), tenant bindings resolved, breadcrumbs, cross-links, print CSS, provenance footer, mobile responsive
- [ ] Every Outline-tier page has: header, executive summary paragraph, populated section bullets, at least one data element, tenant bindings resolved, breadcrumbs, cross-links, mobile responsive
- [ ] Every Stub-tier page has: header, scheduled banner, trigger conditions, structure preview, breadcrumbs, cross-links — and NO fake content
- [ ] No placeholder text anywhere (no "Lorem ipsum," no "TBD," no "{{variable}}")
- [ ] No unresolved tenant variables

**Level 4 — Navigation flows (demo click-paths)**
- [ ] Home → Apex dashboard → Morrison program → every Morrison deliverable (Rich path must be flawless)
- [ ] Home → Meridian dashboard → Ambient program → every Ambient deliverable (Rich path must be flawless)
- [ ] From any deliverable, click the source pattern → pattern page renders with tenant context
- [ ] From any pattern page, click "applicable to tenants" → tenant-scoped view renders
- [ ] From any phase view, click forward through all deliverables in order → no broken links
- [ ] Back button returns to the previous page with scroll position preserved
- [ ] Mobile navigation works end-to-end on Morrison click-path

**Level 5 — Performance & accessibility**
- [ ] FCP ≤ 1.5s, LCP ≤ 2.5s on throttled 3G Fast
- [ ] Lighthouse accessibility score ≥ 90 on every Rich-tier page
- [ ] No console errors on any page
- [ ] Print preview renders cleanly on all Rich pages (Morrison deliverables tested end-to-end)
- [ ] Screen reader announces breadcrumbs, headings, and landmarks correctly

### 4.5 · Audit tooling

- **Link crawler:** a script that starts at `/` and follows every internal link, recording status codes. Pre-commit and nightly.
- **Tenant binding linter:** parses rendered HTML and flags any `{{...}}`, `undefined`, `null`, or "TBD" strings.
- **Visual regression:** screenshot diff on Morrison and Ambient click-paths, gated on CI.
- **Manual audit:** for the two Rich programs, a human walks every deliverable and records pass/fail per Level 3 criteria.

---

## Part 5 · Demo-Critical Subset (what must be Rich for Prat)

### 5.1 · The golden path

Prat's demo click-path runs through Apex Retail / Morrison with optional divergence into Meridian / Ambient to prove healthcare coverage. Everything on the golden path must be Rich-tier and audited to Level 4/5 standards above.

**Primary click-path:**

1. Home → Apex dashboard
2. Apex programs index (shows all 6 Apex programs with phase badges and outcome projections)
3. Morrison program page (shows 5-phase timeline, current phase P4 highlighted, outcome projection, CXO decision log)
4. Morrison Phase 3 view (shows all 6 Phase 3 deliverables with status)
5. D12 Estimation & Execution Roadmap (Rich — this is the flagship deliverable)
6. D17 Decision Memo (Rich — the "document Prat would actually read")
7. Back to Morrison → Phase 4 view
8. D19 Delivery Plan (Rich)
9. D24 Outcome Measurement Plan (Rich)
10. Click Phase 5 → see explicit Stub page with activation criteria
11. Click source pattern link → `owned-brand-margin-recovery` pattern page opens with Apex tenant context
12. Click "analogous programs" on the pattern page → shows Ambient program at Meridian as an analogous case (cross-tenant graph traversal)

**Secondary click-path (healthcare proof):**

1. Home → Meridian dashboard
2. MRD-01 Ambient Clinical Value Chain program page
3. Phase 3 deliverables (Rich)
4. D17 Decision Memo Ambient (Rich)
5. Source pattern `ambient-clinical-value-chain` renders with value chain diagram

### 5.2 · Demo-critical Rich deliverables (full list)

**Apex / Morrison (APX-01) — 19 Rich deliverables:**

Phase 1: D01, D02, D03, D04
Phase 2: D07, D08, D09, D10, D11
Phase 3: D12, D14, D15, D16, D17, D18
Phase 4: D19, D20, D22, D24
Phase 5: Stubs for D25, D26, D27, D28 (explicit scheduled state)

**Apex / Demand Forecasting (APX-02) — 11 Rich deliverables:**

Phase 1: D01, D02, D03 (Rich)
Phase 2: D07, D08, D11 (Rich)
Phase 3: D12, D15, D16, D17 (Rich — current phase) + D13 Target Architecture (Rich, since AP-adjacent)
Phase 4: Stubs
Phase 5: Stubs

**Meridian / Ambient (MRD-01) — 14 Rich deliverables:**

Phase 1: D01, D02, D03, D04
Phase 2: D06, D08, D10, D11
Phase 3: D12, D13, D15, D16, D17, D18
Phase 4-5: Stubs

**Total Rich deliverables to author:** 44 Rich-tier deliverable pages.

### 5.3 · Demo rehearsal acceptance

Before the Prat demo, the full click-path is rehearsed end-to-end three times:

- **Rehearsal 1 (T-7 days):** Anand drives, full click-path, record friction points, fix same day.
- **Rehearsal 2 (T-3 days):** Anand drives on mobile device, verify mobile rendering on all golden path pages.
- **Rehearsal 3 (T-1 day):** Anand drives with network throttled to 3G Fast, verify performance budget holds. Run link crawler on Morrison subtree. Zero 404s or broken links tolerated.

Any failure at T-1 blocks the demo and triggers escalation.

---

## Part 6 · Implementation Order & Acceptance Criteria

### 6.1 · Work decomposition

The enhancement splits into six workstreams. Estimated effort in agent-days assumes a Claude Code agent working in parallel with a Codex agent.

| Workstream | Owner | Scope | Effort | Depends on |
|---|---|---|---|---|
| **WS1** | Seed generator | Archetype-phase-deliverable manifest encoding + tenant portfolio seeds | 3-4 days | Matrix confirmed |
| **WS2** | Render contract | Rich/Outline/Stub component library + fidelity registry | 3 days | Design system tokens |
| **WS3** | Rich content authoring | 44 Rich-tier deliverables for Morrison + Demand Forecasting + Ambient | 5-7 days | WS1, WS2 |
| **WS4** | Outline content authoring | ~240 Outline-tier deliverables across 17 non-hero programs | 4-6 days (Codex-heavy) | WS1, WS2 |
| **WS5** | Routing + link integrity | URL canonicalization, cross-link generation, audit tooling | 2-3 days | WS2 |
| **WS6** | Audit + rehearsal | Run Levels 1-5 of the audit checklist; 3 rehearsals | 2 days | WS3, WS4, WS5 |

### 6.2 · Sequence

1. **Day 0-1:** Lock the Part 1 matrix. Encode it as a data artifact (JSON or YAML) the seed generator reads. No deliverable is created outside the matrix.
2. **Day 1-2:** Lock the Part 2 tenant portfolio seeds as data artifacts. Seed generator can now emit program + deliverable instances per tenant.
3. **Day 2-5:** WS2 in parallel with WS3 start. Render contract components built; Morrison Rich content begins authoring against them.
4. **Day 5-8:** Complete all Rich content. Parallel Outline content generation by Codex. WS5 routing work in parallel.
5. **Day 8-10:** WS6 audit. Run the full Levels 1-5 checklist. Fix fails same day.
6. **Day 10-11:** Rehearsal 1 (T-7 days before demo), fix friction.
7. **T-3:** Rehearsal 2 (mobile).
8. **T-1:** Rehearsal 3 (throttled network + link crawl).
9. **Demo day.**

### 6.3 · Acceptance criteria per workstream

**WS1 accepted when:**
- Matrix encoded as machine-readable artifact
- Seed generator emits the correct deliverable set for any (archetype, phase) pair
- All 4 composite tenant portfolios produce the exact program count and phase distribution in Part 2
- Deliverable instance counts match the Part 2 totals (~280-320)

**WS2 accepted when:**
- Rich, Outline, Stub render as three distinct React components with documented props
- Design tokens applied consistently (dark working zone for deliverable pages)
- Mobile breakpoints tested on iPhone and Android widths
- Print CSS tested on Rich pages

**WS3 accepted when:**
- 44 Rich deliverables meet Level 3 criteria in Section 4.4
- Every Rich page has resolved tenant bindings
- Every Rich page has at least one chart, one KPI strip, one data table
- Decision log present on Phase 3+ deliverables

**WS4 accepted when:**
- ~240 Outline deliverables meet Level 3 Outline criteria
- No placeholder text detected by the linter
- All cross-links resolve

**WS5 accepted when:**
- Link crawler shows zero 404s
- All breadcrumb chains functional
- All mandatory cross-link classes (Section 4.2) present on every deliverable page

**WS6 accepted when:**
- Levels 1-5 audit checklist fully green
- Three rehearsals complete with zero blocking issues at T-1

### 6.4 · Ownership & handoff to Claude Code

This spec is the authoritative handoff. The Claude Code agent picking it up should:

1. Read Parts 1-6 in order. The matrix (Part 1) is the contract. The tenant portfolios (Part 2) are the seed. The render tiers (Part 3) are the production spec.
2. Produce the matrix as a machine-readable artifact first. Check it into the repo at `intelligence/seeds/archetype-phase-deliverable-matrix.json`.
3. Produce the tenant portfolio seeds at `intelligence/seeds/tenant-portfolios/{tenant_slug}.json`.
4. Build the render components in `components/deliverables/{Rich,Outline,Stub}.tsx`.
5. Wire up routes using Next.js dynamic segments matching Section 4.1 exactly.
6. Implement the link crawler as a pre-commit hook and CI gate.
7. Run the Level 1-5 audit before opening any PR that touches the demo click-path.

### 6.5 · What this spec does not cover

- **Runtime generation during a live demo session** — covered by `dynamic-deliverable-generation-spec.md` (the "generate this deliverable now" interactive path). This spec handles pre-seeded state; the dynamic spec handles live agent generation. They share the matrix (Part 1) and render contract (Part 3).
- **Voice/tone guidelines for deliverable prose** — covered separately in the design system and content style guides.
- **Data ingestion of tenant-specific inputs** — covered in `abarva-data-ingestion-integration-spec.md`.

---

## Summary

- **Gap 1 (thin, phase-uneven portfolios):** Closed by the 19-program seed in Part 2, which guarantees every phase is represented across every tenant and every archetype is seeded at least 3 times.
- **Gap 2 (no archetype × phase × deliverable manifest):** Closed by the Part 1 matrix, which declares required and optional deliverables for every (archetype, phase) pair.
- **Gap 3 (inconsistent render fidelity):** Closed by the Part 3 three-tier contract (Rich / Outline / Stub) and the Part 4 routing + audit guarantee that every route renders correctly at its declared tier.

**Demo consequence:** Morrison gets 19 Rich deliverables across 5 phases. Ambient gets 14. Demand Forecasting gets 11. Everything else renders Outline-or-better with no broken links.

**Claude Code next action:** Encode the Part 1 matrix as `intelligence/seeds/archetype-phase-deliverable-matrix.json` and begin WS1.

---

*End of Programs Seed & Deliverable Generation Enhancement Spec.*
