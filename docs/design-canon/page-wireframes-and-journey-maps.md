# AbarVa · Wireframes & Persona Journey Maps

**Version:** 1.0 · April 22, 2026
**Owner:** Anand Sundaram
**Status:** Authoritative design reference. Wireframes and journey maps for all 7 pages across 5 personas.
**Companion documents:** `page-strategic-purpose-definition.md` (the charter), `programs-seed-and-deliverable-generation-enhancement-spec.md` (the seed + render contract).

---

## Part 0 · How to use this document

This document translates the strategic purpose charter into concrete design wireframes and navigation journeys. It sits between the charter ("what each page is for") and the working design system ("how each component looks").

Use the wireframes as the structural contract — every page must have these zones, these elements, and these cross-links. Use the journey maps to pressure-test that the structure actually serves the people using it. If a persona journey breaks against the wireframe, one of the two is wrong.

Wireframes are expressed as block-level markdown diagrams with labeled zones. They describe structure and content hierarchy, not pixels. Visual design — typography, color, spacing — lives in the design system spec.

---

## Part 0.5 · Current state vs. aspirational content (READ BEFORE AUTHORING ANY PAGE CONTENT)

**Before any content goes on Home, Platform, or Investor surfaces, it is audited against this honesty frame.** AbarVa is pre-seed, pre-revenue, pre-customer. Content that implies paying clients, signed design partners, deployed production outcomes, or measured ROI is forbidden. This is a non-negotiable integrity rule — discovering an overclaim during investor diligence is a round-killer.

### What is real today (Apr 22, 2026)

- **Product live at preview URL** (`nexus-vert-kappa.vercel.app`) — working demo, accessible, clickable.
- **13 pattern packs authored** as spec-grade content (5 universal + 8 vertical).
- **4 composite reference tenants** — Meridian Health, Apex Retail, First Capital, Keystone Energy. Built from real-world data patterns; not real clients. Every reference carries the "composite organization built from real-world data" label.
- **Morrison Owned Brand Margin Recovery** as a fully-built reference program inside Apex Retail — composite demo, not a real engagement.
- **4-agent architecture** (Nexus, Sentinel, Atlas, Steward) designed and partially shipped.
- **Pricing tiers defined** ($350K / $800K / $1.6M with bundled maestro hours) — offered model, not billed model.
- **Pattern pack spec depth** — the intelligence layer design pack is authored and production-ready.
- **Shail Jain** as seed angel and advisor — real relationship.
- **Prat** (Fortune 40 CIPO) being actively cultivated as a design partner — conversation in progress, not signed.
- **Anthology Fund** targeted as seed investor — conversation planned, not committed.
- **Seed round structure** — $8M at $25M cap — target, not raised.

### What is NOT real yet (and must not be implied)

- Paying customers. There are zero.
- Signed design partner agreements, MOUs, or LOIs.
- Production deployments at any named customer.
- Measured outcome attestations on real clients.
- Revenue, ARR, or run-rate numbers.
- Customer testimonials, case studies, or named references.
- Logos of real companies as "customers" or "partners."
- SOC 2 Type II certification (timeline target, not current).
- HIPAA certification (architecture target, not certified).
- Any claim that "X happens every day on the platform" when platform has no active tenants.

### Content rules per page

- **Home:** proof strip may cite pattern count (real), composite tenant count (explicitly labeled composite), and authored framework depth. No "customers love us," no logos, no testimonials, no "trusted by."
- **Platform:** compliance claims must be labeled as target or in-progress, with dates. Architecture claims are fine (architecture exists). Pricing tiers are offered, not billed — acceptable as-is.
- **Investor:** traction section describes real relationships (Shail, Prat cultivation, Anthology target) and real artifacts (product live, patterns authored, Morrison demo). No fabricated MOUs, no revenue numbers, no customer names. Milestones expressed as target dates, not accomplished events.
- **Intelligence:** pattern library content is real (authored). Cross-client intelligence claims should be framed as "designed to compound" rather than "already compounding" until real tenants contribute.
- **Programs / Control Tower / Admin:** authenticated surfaces demonstrate composite tenants. Composite label mandatory on every tenant reference. Content within composite tenants can be fully rendered at Rich fidelity — that is what demos are for.

### The honesty test

Before any content line ships to Home, Platform, or Investor, ask: *If Prat or Anthology's lead partner asked "is this a real customer?" or "has this actually happened?" — what's the honest answer?* If the answer is "not yet" or "in progress," the content must reflect that.

This frame applies to every wireframe, journey map, and click path below. Wireframes describe the structural shape of each page; the **content authoring contract** above governs what words go into those shapes.

---

## Part 1 · Personas

Five core personas cover ~95% of the product's user base. Each has a distinct goal, rhythm, and navigation pattern. Every wireframe and journey is tested against these five.

### 1.1 · The CXO · "Prat" archetype

**Who:** Chief Information Officer, Chief AI Officer, Chief Product Officer, Chief Risk Officer at Fortune 500-class enterprises. The Prat persona is the canonical target.

**Goal:** Govern the AI estate. Reduce risk. Rationalize spend. Accelerate outcomes. Know what's happening across their AI portfolio in five minutes or less.

**Session rhythm:** 3-5 minutes, 3-5 times per week. Monday morning check; in-between-meetings scan; Friday wrap. Occasional 30-minute Phase 3 interview or Phase 4 validation session inside Programs.

**Device:** Desktop during work (primary). Mobile between meetings (checks only, no decisions).

**Navigation habits:** Direct to known pressures. Scans KPIs before reading prose. Drills only on red flags. Trusts the system to elevate what matters; abandons surfaces that bury the signal.

**Primary surface:** AI Control Tower.
**Secondary surfaces:** Programs (CXO touch moments only), Investor page if they are also an investor.

**Will abandon if:** Page load > 2s. First-screen doesn't show pressure. Generic dashboard without point-of-view.

### 1.2 · The Maestro · "Maya" archetype

**Who:** Senior consultant inside a client tenant or an AbarVa-delivered engagement. Runs 2-4 programs at once. Leverages patterns daily.

**Goal:** Run programs efficiently. Produce high-quality deliverables. Reuse intelligence. Hit phase gates on time.

**Session rhythm:** 2-4 hour deep-work blocks. Several per day.

**Device:** Desktop primary. Dual monitor common.

**Navigation habits:** Lives inside Programs with a second tab on Intelligence. Uses cross-links constantly. Searches patterns by keyword. Treats the Maestro Intake Interface as a collaborator, not a form.

**Primary surfaces:** Programs (all day), Intelligence (hourly).
**Secondary surfaces:** Admin (setup only).

**Will abandon if:** Cross-links don't work. Pattern injection misses relevance. Deliverable rendering is inconsistent. Save-state is unreliable.

### 1.3 · The Investor · "Jake" archetype

**Who:** Investor at Anthology Fund, seed angel, or Series A prospect. In diligence mode.

**Goal:** Build conviction on AbarVa or disqualify quickly. Decide on term sheet.

**Session rhythm:** 20-40 min per session. 3-5 sessions across a decision cycle (7-14 days).

**Device:** Desktop primary.

**Navigation habits:** Starts on Investor page. Opens multiple tabs into Programs (Morrison demo), Intelligence (canonical patterns), Platform (architecture). Returns to Investor page after each dive. Reads FAQ. Requests data room when ready.

**Primary surface:** Investor page.
**Secondary surfaces:** Programs (Morrison path), Intelligence (3 canonical patterns), Platform (architecture section).

**Will abandon if:** Page feels static between visits (no velocity signal). Product links lead to broken or thin demos. Data room is gated behind a sales call.

### 1.4 · The Design Partner · "Dara" archetype

**Who:** CTO/CIO staff, enterprise architect, or head of AI at a prospective design partner. Evaluating whether AbarVa can plug into their stack.

**Goal:** Assess engineering depth. Verify security posture. Understand integration and pricing. Report back internally.

**Session rhythm:** 15-30 min initial. 2-3 return visits during internal evaluation.

**Device:** Desktop.

**Navigation habits:** Platform-first. Drills into agent roster, integration catalog, security, pricing. Spot-checks Programs for product depth. Rarely visits Intelligence unless specifically pointed there.

**Primary surface:** Platform.
**Secondary surfaces:** Programs (spot check), Home (context).

**Will abandon if:** Platform feels like marketing fluff. Architecture is vague. Pricing is "contact sales." Security posture is unclear.

### 1.5 · The Client Admin · "Connor" archetype

**Who:** IT admin, identity/SSO owner, data engineering lead at a client tenant. Responsible for AbarVa provisioning on the client side.

**Goal:** Provision users. Configure connectors. Monitor tenant health. Close support tickets without involving AbarVa.

**Session rhythm:** Task-driven. 5-15 min per task. Intermittent — could be daily during onboarding, then weekly.

**Device:** Desktop.

**Navigation habits:** Direct to the Admin function they need. Rarely browses. Expects keyboard shortcuts.

**Primary surface:** Admin (client-side).
**Secondary surfaces:** Programs (to verify provisioning worked).

**Will abandon if:** Admin requires AbarVa support for routine tasks. Audit log is incomplete. SSO/SCIM doesn't work first try.

---

## Part 2 · Shared Chrome

Before page-specific wireframes, the chrome elements that appear across authenticated surfaces (Programs, Tower, Intelligence, Admin).

### 2.1 · Top navbar (authenticated)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [AbarVa]  [Tenant: Meridian Health ▾]  Home  Programs  Intelligence  Control │
│                                                                    Tower  Platform         Investor →│
└──────────────────────────────────────────────────────────────────────────────┘
```

- **AbarVa wordmark** (Georgia serif; Abar 17px 800 white, Va 23px 900 teal): always clickable, routes to `/` (Home for public, tenant dashboard for authenticated).
- **Tenant switcher** (DM Sans 14px 600): shows current tenant with composite indicator dot. Dropdown lists tenants the user has access to; search input at top of dropdown for >10 tenants.
- **Primary nav links** (DM Sans 14px 600 white → 700 teal on hover): Home · Programs · Intelligence · Control Tower · Platform.
- **Investor link** (right-aligned, subtle): visible only if the user has an investor token attached to their session; otherwise hidden.
- **No logged-in avatar yet** — click-to-switch via the tenant switcher; global profile menu deferred to post-seed.

### 2.2 · Top navbar (public, unauthenticated)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [AbarVa]                Home  Platform  Intelligence  Research      [Sign in]│
└──────────────────────────────────────────────────────────────────────────────┘
```

- Fewer links. No tenant switcher. No Programs or Control Tower (authenticated-only). Research routes to Intelligence publications surface.
- **Sign in** (outline button, DM Sans 14px 700): routes to auth. Investor path is separate token-gated URL.

### 2.3 · Breadcrumb row (below navbar on working surfaces)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Meridian Health › Programs › Ambient Clinical Value Chain › Phase 3 › D17    │
└──────────────────────────────────────────────────────────────────────────────┘
```

Every breadcrumb element is clickable and resolves to a valid page. Trailing element is current view (not a link). Breadcrumbs appear on Programs, Intelligence (pattern detail), Control Tower sub-surfaces, Admin sub-surfaces.

### 2.4 · Footer (global)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Composite organization built from real-world data.                           │
│ Last updated 2d ago · Generated by Nexus · Grounded in 14 evidence sources   │
│                                                                              │
│ Privacy · Security · Research · Contact                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Composite disclaimer** on every authenticated page with tenant content.
- **Provenance line** on generated content surfaces (deliverables, patterns, Tower summaries).
- **Minimal links**: privacy, security, research, contact. No social icons, no newsletter signup, no cookie banner theater beyond what's legally required.

---

## Part 3 · Page Wireframes

### 3.1 · Home

**Route:** `/`
**Zone model:** Light-cream hero → category thesis → proof strip → CTA band → footer.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [PUBLIC NAVBAR]                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  HERO                                                              LIGHT CREAM │
│  ────                                                                        │
│                                                                              │
│  Own it.  Build it.  Keep it.                                                │
│                                                                              │
│  Intelligence. Now act on it.                                                │
│  Act on intelligence. Before the window closes.                              │
│                                                                              │
│  [See it in action →]   [How it works]   [Read the research]                 │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CATEGORY THESIS (3 columns)                                      LIGHT      │
│  ───────────────                                                             │
│                                                                              │
│  THE CONSULTING GAP       THE INTELLIGENCE MOAT     THE OUTCOME MODEL        │
│  Advisors deliver         Every program            Traditional consulting    │
│  slides. Enterprises      compounds into the       bills for time. We        │
│  need outcomes.           pattern library.         price the outcome.        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PROOF STRIP (anchored numbers)                                   LIGHT      │
│  ───────────                                                                 │
│                                                                              │
│  13 patterns authored │ 4 composite reference tenants │ Outcome attestation │
│                       │  (demo, not customers)         │ framework designed  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CTA BAND (low-chrome, high-intent)                               LIGHT      │
│  ────────                                                                    │
│                                                                              │
│  Ready to see the Morrison program in action?                                │
│  [See the demo →]                                                            │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Content rules:**
- Hero holds ≤ 15 words. Secondary message ≤ 12 words. Three CTAs, in order of intent strength.
- No hero images of people. No video autoplay. No chatbot popup.
- Category thesis panels ≤ 25 words each. Anchor verbs; avoid adjectives.
- Proof strip shows 3-5 numbers with sources linked to the Intelligence or Programs surfaces.
- CTA band is the only place on Home with dark background — signals the handoff to the product.

**Responsive:**
- Mobile: hero stacks, thesis panels stack vertically, proof strip becomes numbered list, CTA band sticky at bottom.

**Content honesty notes (Home):**
- **No customer logos.** There are no customers.
- **No testimonials.** No real ones exist; fabricated ones are a round-killer.
- **No "trusted by" or "used by" strips** until at least one paying customer or signed design partner exists.
- **Proof strip claims only what is authored or architecturally real:** pattern count (real authored content), composite reference tenants (explicitly labeled), outcome attestation framework (designed — not yet proven against a real outcome).
- **"See it in action" CTA** routes to the composite Morrison demo; the demo itself is clearly a composite, not a customer showcase.

### 3.2 · Programs

Multi-view page. Four sub-views covered: (a) Programs index, (b) Program page, (c) Phase view, (d) Deliverable page.

#### 3.2.a · Programs index

**Route:** `/tenant/{tenant_slug}/programs`
**Who lands here:** Maestro starting a session; CXO checking program state; client admin verifying.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Meridian Health › Programs                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Programs                                   [+ Start new program]            │
│  ────────                                                                    │
│                                                                              │
│  Filter: All phases ▾  All archetypes ▾   Sort: Most active ▾  [Search...]   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ MRD-01 Ambient Clinical Value Chain             Phase 3 · Design     │    │
│  │ AP archetype · Started Feb 2026 · Due Aug 2026                       │    │
│  │ Projected outcome: $14M-$22M/yr ambient value chain lift             │    │
│  │ Current phase pressures: 2 open decisions, 1 risk                    │    │
│  │ [Open →]                                                             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ MRD-02 Prior Authorization Automation          Phase 4 · Build       │    │
│  │ WA archetype · Started Nov 2025 · Due Jul 2026                       │    │
│  │ Projected outcome: 38% denial reduction in target LOBs               │    │
│  │ Current phase pressures: 1 risk, go-live gate approaching            │    │
│  │ [Open →]                                                             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ MRD-03 Clinical Documentation AI Governance    Phase 1 · Intake      │    │
│  │ ST archetype · Started Apr 2026                                      │    │
│  │ Projected outcome: Pending diagnosis                                 │    │
│  │ Current phase pressures: Charter under review                        │    │
│  │ [Open →]                                                             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ...                                                                         │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER with composite disclaimer]                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Content rules:**
- Each card: program code, name, phase badge with phase number, archetype code, start date, expected end date, projected outcome (in $/units/%), current phase pressures (count of open decisions/risks/overdue items), primary CTA.
- "Current phase pressures" is the most important element — it's what the CXO scans.
- Phase badge uses consistent colors across the product (defined in design system).
- Cards clickable on the title or `[Open →]`.
- Filter defaults: All phases, All archetypes, sorted by most active (recent activity first).

#### 3.2.b · Program page

**Route:** `/tenant/{tenant_slug}/programs/{program_slug}`
**Primary view:** 5-phase timeline with current phase highlighted; decision log; deliverable inventory.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Meridian Health › Programs › Ambient Clinical Value Chain                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MRD-01 · AP archetype · Phase 3 · On track                                  │
│  Ambient Clinical Value Chain Activation                                     │
│  ────────────────────────────────────────                                    │
│                                                                              │
│  Sponsor: Dr. L (CMIO) · Maestro: Maya (AbarVa) · Started Feb 10, 2026       │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │  P1 Intake ●───●  P2 Diagnosis ●───●  P3 Design ◉───○  P4 Build ○   │    │
│  │  Mar 3 ✓          Apr 1 ✓              Apr 22 ▸             May 30    │    │
│  │                                                                      │    │
│  │  P5 Outcome ○                                                        │    │
│  │  Aug 15                                                              │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  PHASE 3 · DESIGN & DECISION                                                 │
│  Gate criterion: Target state designed, intervention portfolio selected,     │
│  CXO alignment achieved.                                                     │
│                                                                              │
│  Deliverables (6):                                                           │
│  ● D12 Estimation & Execution Roadmap               Ready for review         │
│  ● D13 Target State Architecture                    Draft                    │
│  ● D15 Intervention Portfolio                       Ready for review         │
│  ● D16 Business Case                                Draft                    │
│  ● D17 Decision Memo for CXO                        Pending Dr. L interview  │
│  ● D18 Risk Register                                Draft                    │
│                                                                              │
│  [Open Phase 3 detail →]                                                     │
│                                                                              │
│  ── Decision log ──                                                          │
│  Apr 18 · Elevated ambient vendor DAX to preferred (from DAX/Abridge tie)    │
│  Apr 15 · Scope narrowed to inpatient first (outpatient deferred to Phase 5) │
│  Apr 10 · Risk tier raised to CRITICAL for HCC coding claim accuracy         │
│  ...                                                                         │
│                                                                              │
│  ── Projected outcome ──                                                     │
│  $14M-$22M/yr ambient value chain lift (HCC + quality + CDI + denial prev.)  │
│  Dual-ledger reconciliation scheduled at Phase 5.                            │
│                                                                              │
│  ── Cross-links ──                                                           │
│  Source pattern: Ambient Clinical Value Chain Automation [open →]            │
│  Analogous program (Apex Retail): Demand Forecasting Modernization [open →]  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Content rules:**
- Timeline is the signature visual — single scrub bar showing all 5 phases with current phase marker prominent.
- Current phase section expanded inline; past phases collapsed to summary chips; future phases shown as stubs.
- Decision log: 3-5 most recent decisions shown; full log in drawer.
- Projected outcome always visible.
- Cross-links to source pattern and analogous programs.

#### 3.2.c · Phase view

**Route:** `/tenant/{tenant_slug}/programs/{program_slug}/phase/{n}`
**Primary content:** All deliverables for that phase, gate criterion, open questions.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Meridian Health › Programs › Ambient Clinical Value Chain › Phase 3          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 3 · Design & Decision                   Due: Apr 30, 2026             │
│  ────────────────────────────                                                │
│                                                                              │
│  Gate criterion: Target state designed, intervention portfolio selected,     │
│  CXO alignment achieved.                                                     │
│                                                                              │
│  Gate readiness: 4 of 6 deliverables ready · 1 pending CXO · 1 in draft      │
│                                                                              │
│  ── Deliverables ──                                                          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ D12 Estimation & Execution Roadmap    Rich    Ready for review       │    │
│  │ 72-page roadmap with intervention sequencing and resource plan       │    │
│  │ [Open →]                                                             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ D13 Target State Architecture         Rich    Draft                  │    │
│  │ Ambient platform + 6 downstream value streams; vendor landscape      │    │
│  │ [Open →]                                                             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ...                                                                         │
│                                                                              │
│  ── Open questions (surfaced by Nexus) ──                                    │
│  • Should outpatient be sequenced into Phase 4 or deferred to Phase 5?       │
│  • Vendor exit clauses for Abridge pilots — 90 or 180 days?                  │
│                                                                              │
│  ── Next phase gate ──                                                       │
│  [Request Phase 3 gate review →]                                             │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Content rules:**
- Gate readiness is the headline number on this view.
- Open questions elevated — these are the things holding the phase back.
- Request phase gate review is a primary action; triggers the gate workflow.

#### 3.2.d · Deliverable page

**Route:** `/tenant/{tenant_slug}/programs/{program_slug}/deliverables/{code}`
**Render:** Rich / Outline / Stub — per the fidelity contract.

Rich deliverable (for Morrison and Ambient hero programs):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Meridian Health › Programs › Ambient Clinical Value Chain › Phase 3 › D17    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  D17 · Decision Memo for CXO                                                 │
│  ────────────────────────────                                                │
│  Phase 3 · Design & Decision  │ Status: Ready for Dr. L review              │
│                                                                              │
│  ── Executive summary ──                                                     │
│  Recommend activating ambient documentation platform (DAX + Abridge         │
│  dual-vendor strategy) across 14 hospitals, anchoring downstream HCC,       │
│  quality, and denial-prevention value streams. Capital commitment $6.8M     │
│  over 18 months; projected net impact $14M-$22M/yr at steady state.         │
│                                                                              │
│  ── KPI strip ──                                                             │
│  ┌───────────┬───────────┬───────────┬───────────┐                           │
│  │ Capital   │ Net impact│ Payback   │ Risk tier │                           │
│  │ $6.8M     │ $14-22M/yr│ 9-14 mo   │ HIGH      │                           │
│  └───────────┴───────────┴───────────┴───────────┘                           │
│                                                                              │
│  ── Recommendation ──                                                        │
│  [Full narrative body: 1,200-1,500 words]                                    │
│  ...                                                                         │
│                                                                              │
│  ── Decision log extract ──                                                  │
│  [Decisions leading up to this memo]                                         │
│                                                                              │
│  ── Data table: vendor comparison ──                                         │
│  [Sortable table of 6 vendors × 8 criteria]                                  │
│                                                                              │
│  ── Chart: projected outcome timeline ──                                     │
│  [Line chart showing accumulated savings over 36 months]                     │
│                                                                              │
│  ── Risks and mitigations ──                                                 │
│  [List]                                                                      │
│                                                                              │
│  ── Cross-links ──                                                           │
│  Source pattern: Ambient Clinical Value Chain Automation                     │
│  Prerequisite: D16 Business Case                                             │
│  Downstream: D18 Risk Register · D19 Delivery Plan                           │
│                                                                              │
│  ── Provenance ──                                                            │
│  Generated by Nexus on Apr 21 · Grounded in 23 evidence sources              │
│  · Last updated 2h ago                                                       │
│                                                                              │
│  [Print view]  [Send to Dr. L for review]  [Request Nexus regeneration]     │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER with composite disclaimer]                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Outline deliverable** (for non-hero programs): same top-level structure; no KPI strip, no chart, no decision log, narrative compressed to ~300 words.

**Stub deliverable** (for future phases):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ D25 · Outcome Attestation Report                          Stub — scheduled   │
│ ────────────────────────────────                                             │
│                                                                              │
│  This deliverable activates when Program reaches Phase 5.                    │
│  Trigger: Phase 4 gate passed AND outcome measurement period (90 days)       │
│  complete.                                                                   │
│                                                                              │
│  Expected sections when generated:                                           │
│  • Outcome reconciliation (AbarVa ledger vs. client finance ledger)          │
│  • Baseline vs. measured values for each KPI                                 │
│  • Attribution methodology                                                   │
│  • Attestation signatures                                                    │
│                                                                              │
│  Prerequisites:                                                              │
│  • D24 Outcome Measurement Plan (Phase 4) must be live and tracking          │
│  • D26 Financial Impact Validation must be in draft                          │
│                                                                              │
│  [Open prerequisite D24 →]                                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 · Intelligence

Two sub-views covered: Library landing; Pattern detail.

#### 3.3.a · Intelligence library

**Route:** `/intelligence`
**Who lands here:** CXO browsing for relevance; investor exploring moat; maestro searching for pattern.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INTELLIGENCE                                                 LIGHT HERO     │
│  ─────────────                                                               │
│                                                                              │
│  The Transformation Genome.                                                  │
│  13 patterns authored. 4 verticals. Designed so every program contributes.   │
│                                                                              │
│  [Browse patterns]   [Read the research]   [Tenant intelligence →]           │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PATTERN LIBRARY                                              DARK WORKING   │
│  ────────────                                                                │
│                                                                              │
│  Filter:                                                                     │
│    Vertical: All · Healthcare · Retail · FinServ · Energy · Cross-sector     │
│    Function: All · Front office · Middle office · Back office                │
│    Archetype: All · ST · WA · PM · AP · OO                                   │
│  Search: [_________________________]                                         │
│                                                                              │
│  [Pattern cards in grid — 3 columns on desktop, stacked on mobile]           │
│                                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐    │
│  │ UNIVERSAL           │ │ HEALTHCARE          │ │ HEALTHCARE          │    │
│  │ Analytics           │ │ Ambient Clinical    │ │ Prior Authorization │    │
│  │ Modernization       │ │ Value Chain         │ │ Automation          │    │
│  │ 8 observations      │ │ 6 observations      │ │ 4 observations      │    │
│  │ Updated 3d          │ │ Updated 1d          │ │ Updated 7d          │    │
│  │ [Open →]            │ │ [Open →]            │ │ [Open →]            │    │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘    │
│  ...                                                                         │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  RESEARCH PUBLICATIONS                                        LIGHT SECTION  │
│  ─────────────────────                                                       │
│                                                                              │
│  [Recent external publications, 3-5 cards]                                   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.b · Pattern detail

**Route:** `/intelligence/patterns/{pattern_slug}`
**Who lands here:** Deep reader (CXO, investor, maestro) following a specific pattern.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Intelligence › Patterns › Ambient Clinical Value Chain Automation            │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┬──────────────────────────┐ │
│ │ PATTERN BODY (center, ~800px)                │ SIDEBAR (right, ~280px)  │ │
│ │ ────                                         │ ────────                 │ │
│ │                                              │                          │ │
│ │  Ambient Clinical Value Chain Automation     │ [Section nav — sticky]   │ │
│ │  Healthcare · High depth                     │ A · Identity             │ │
│ │                                              │ B · Classification       │ │
│ │  "Ambient listening is not a scribe         │ C · Detection            │ │
│ │  vendor. It is the platform underneath       │ D · Causal structure     │ │
│ │  the entire clinical value chain."          │ E · Interventions        │ │
│ │                                              │ F · Anti-patterns        │ │
│ │  ── A · Identity ──                          │ G · Vendor landscape     │ │
│ │  [prose, 400-600 words]                      │ H · Regulatory           │ │
│ │                                              │ I · Observations         │ │
│ │  ── B · Classification ──                    │ J · Success measures     │ │
│ │  [structured taxonomy]                       │ K · Timeline             │ │
│ │                                              │ L · Governance           │ │
│ │  ── C · Detection ──                         │ M · Sector variants      │ │
│ │  Signals (8):                                │ N · Related patterns     │ │
│ │  1. Ambient rollout without HCC integration  │                          │ │
│ │  2. ...                                      │ ── Applicable tenants ─  │ │
│ │                                              │ • Meridian Health (MRD-01)│ │
│ │  Diagnostic questions (8):                   │                          │ │
│ │  1. Is ambient generating $ on quality       │ ── Related patterns ──   │ │
│ │     measures or only on documentation?       │ • Prior Auth Automation  │ │
│ │  2. ...                                      │ • Analytics Modernization│ │
│ │                                              │                          │ │
│ │  [Continue through Parts D-N]                │ ── Regulatory ──         │ │
│ │                                              │ HIPAA · Part 2 · RADV    │ │
│ │  ── Value chain diagram ──                   │ Info Blocking            │ │
│ │  [SVG: ambient central + 6 streams radiating]│                          │ │
│ │                                              │                          │ │
│ │  ...                                         │                          │ │
│ │                                              │                          │ │
│ └──────────────────────────────────────────────┴──────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER with composite disclaimer + provenance]                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Content rules:**
- Sidebar is sticky; section nav jumps to anchors.
- Applicable tenants panel — lets tenant users jump into the tenant-scoped view of the pattern.
- Pattern pages load value chain diagram and any other visual per the pattern-specific rendering contract.
- Mobile: sidebar collapses to top-of-page accordion; section nav becomes a dropdown.

### 3.4 · AI Control Tower

The most commercially resonant page for the CIO-class buyer. Current Control Room view (shown in Apr 22 screenshot) is the default landing; five sub-surfaces handle the specialized views.

**Default view = Control Room.** Five sub-surfaces navigable via a second-level nav: Shadow AI · Vendor Portfolio · Regulatory Posture · AI Council · Model Inventory.

#### 3.4.a · Control Room (landing)

**Route:** `/tenant/{tenant_slug}/tower`
**Reference:** The Apr 22 screenshot is canonical. Structure preserved below.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TOWER · CONTROL ROOM                  [Ask Atlas]  [Open Programs →]        │
│  ────────────────                                                            │
│                                                                              │
│  Meridian Health · Wed, Apr 22 · 7:22 PM                                     │
│                                                                              │
│  [USE CASES 42]  [CONTRADICTIONS 25]  [UNOWNED 3]  [SPEND $1.2M/mo]          │
│  [LAST TURN 2d ago]                                                          │
│                                                                              │
│  ── Pressure today · 3 unowned · highest-dollar ──                           │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ HIGH    $1.3M/mo   AI cloud spend on pace to $2.4M/mo by Q3 without │    │
│  │                    guardrails · 1.8x growth in 12 months · no       │    │
│  │                    consumption attribution · FinOps flag likely    │    │
│  │                    turns into CFO escalation within 90 days.        │    │
│  │                                    [— UNOWNED] [ASSIGN OWNER]       │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ CRITICAL $1.3M/mo  AI spend is scaling like a production platform   │    │
│  │                    while governance still behaves like a pilot      │    │
│  │                    committee.               [— UNOWNED] [OPEN →]    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ CRITICAL $522K/mo  Three ambient-documentation tools, one problem,  │    │
│  │                    no owner. Meridian is still paying overlap       │    │
│  │                    while regional leaders act as if the decision    │    │
│  │                    was already made.          [— UNOWNED] [OPEN →]  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ── KPI strip (5 columns) ──                                                 │
│  ┌────────────┬────────────┬────────────┬────────────┬────────────┐          │
│  │ INVENTORY  │ ADOPTION   │ VALUE      │ RISK       │ COST       │          │
│  │ 42 use cs  │ 64% avg    │ $2.4M ver. │ 16/37 appr │ $1.2M/mo   │          │
│  │ What exists│ Who uses it│ Is it work?│ Is it safe?│ Is it worth│          │
│  │ Prod 13    │ DAU 15250  │ Projected -│ Cond. 7·14 │ LLM $514K  │          │
│  │ Pilot 9    │ WAU 22898  │ Drivers 3  │ High 18    │ Compute256K│          │
│  │ Stalled 14 │ Drop 16%   │ Baseline 7 │ Bias 2     │ License286K│          │
│  └────────────┴────────────┴────────────┴────────────┴────────────┘          │
│                                                                              │
│  ── Active programs (on today's pressure items) ──                           │
│  • Meridian AI Readiness · Phase 1 · Diagnose                                │
│  • Ambient Documentation Vendor Strategy · Phase 0 · Start                   │
│  [Open all →]                                                                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Content rules:**
- Each pressure card: severity chip · $ · editorial line · actions (Assign Owner | Open).
- Editorial lines are POV, not descriptive. "AI spend is scaling like a production platform while governance still behaves like a pilot committee" is the canonical voice.
- KPI question rows ("What exists / Who uses it / Is it working / Is it safe / Is it worth it") force each KPI to answer a question.
- `Ask Atlas` button surfaces the executive agent for ad-hoc queries.
- `[Open Programs →]` routes to the filtered Programs index (programs touching today's pressure items).

#### 3.4.b · Shadow AI sub-surface

**Route:** `/tenant/{tenant_slug}/tower/shadow-ai`
**Primary content:** Unsanctioned activations detected, by severity.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Meridian Health › Control Tower › Shadow AI                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Shadow AI                                                                   │
│  ─────────                                                                   │
│                                                                              │
│  14 unsanctioned activations detected in last 30 days                        │
│  7 hidden-activation (vendor-enabled AI inside existing tools)               │
│  4 self-provisioned (individual user signups with corp email)                │
│  3 unmanaged API usage (OpenAI/Anthropic direct keys)                        │
│                                                                              │
│  ── Detection rail (by severity) ──                                          │
│                                                                              │
│  [Cards — each shows: tool name, detection method, affected users,          │
│   data exposure tier, sanctioned alternative, action CTA]                    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ CRITICAL   Microsoft Copilot for M365 (hidden activation)            │    │
│  │            Detected: license activation audit · 840 users affected   │    │
│  │            Exposure: clinical notes, scheduling, email               │    │
│  │            Sanctioned alternative: Enterprise approved w/ DLP        │    │
│  │            [Review activation] [Sanction] [Block]                    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ...                                                                         │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
```

#### 3.4.c · Vendor Portfolio sub-surface

**Route:** `/tenant/{tenant_slug}/tower/vendors`
**Primary content:** AI vendor inventory, overlap matrix, rationalization recommendations.

```
│  Vendor Portfolio                                                            │
│  ────────────────                                                            │
│                                                                              │
│  47 AI vendors · $1.2M/mo spend · 14 overlap candidates                      │
│                                                                              │
│  ── Overlap matrix (capability × vendor) ──                                  │
│  [Grid: capability categories down, vendors across, heatmap density]         │
│                                                                              │
│  ── Rationalization recommendations ──                                       │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ Ambient documentation · 3 vendors · $522K/mo                         │    │
│  │ Recommendation: Consolidate to 2 (DAX + Abridge dual-vendor)         │    │
│  │ Savings: $174K/mo · Transition risk: Medium                          │    │
│  │ [Open recommendation →]                                              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ...                                                                         │
```

#### 3.4.d · Regulatory Posture

**Route:** `/tenant/{tenant_slug}/tower/regulatory`

```
│  Regulatory Posture                                                          │
│  ──────────────────                                                          │
│                                                                              │
│  ── Framework heat map ──                                                    │
│  ┌─────────────────┬─────────┬──────────────┬──────────────┐                 │
│  │ Framework       │ Coverage│ Gaps         │ Remediation  │                 │
│  ├─────────────────┼─────────┼──────────────┼──────────────┤                 │
│  │ HIPAA           │ 94%     │ 3            │ On track     │                 │
│  │ Info Blocking   │ 87%     │ 5            │ Behind (2)   │                 │
│  │ RADV (MA plans) │ 78%     │ 8            │ Behind (4)   │                 │
│  │ EU AI Act       │ N/A     │ -            │ -            │                 │
│  │ NIST AI RMF     │ 62%     │ 12           │ On track     │                 │
│  │ SR 11-7         │ N/A     │ -            │ -            │                 │
│  │ ISO 42001       │ 45%     │ 18           │ Not started  │                 │
│  └─────────────────┴─────────┴──────────────┴──────────────┘                 │
│                                                                              │
│  [Each row clickable → framework detail with gap-by-gap remediation]         │
```

#### 3.4.e · AI Council

**Route:** `/tenant/{tenant_slug}/tower/council`

```
│  AI Council                                                                  │
│  ──────────                                                                  │
│                                                                              │
│  Cadence: Biweekly · Next meeting: Apr 24, 2pm ET · 4 items on agenda        │
│  Approval queue: 7 items pending · 4 fast-track · 3 full review              │
│                                                                              │
│  ── Agenda for Apr 24 ──                                                     │
│  1. Ambient documentation vendor selection (D17 · decision memo pending)     │
│  2. Shadow Copilot activation — sanction or block                            │
│  3. HCC coding model revalidation schedule                                   │
│  4. Quarterly spend + ROI review                                             │
│                                                                              │
│  ── Open decisions ──                                                        │
│  [List of decisions awaiting council vote]                                   │
│                                                                              │
│  ── Recent decisions ──                                                      │
│  [Last 5 council decisions with vote and rationale link]                     │
```

#### 3.4.f · Model Inventory

**Route:** `/tenant/{tenant_slug}/tower/models`

```
│  Model Inventory                                                             │
│  ───────────────                                                             │
│                                                                              │
│  37 models in production · 18 high-risk · 2 bias incidents in last 90d       │
│                                                                              │
│  ── Model grid ──                                                            │
│  [Columns: name, owner, risk tier, last validation, drift score, bias, actn] │
│  [Sortable and filterable]                                                   │
│                                                                              │
│  ── Drift watchlist (top 5) ──                                               │
│  [Cards with model name, drift metric, trend, owner, action]                 │
```

### 3.5 · Platform

**Route:** `/platform`
**Who lands here:** Technical evaluator (Dara), investor in diligence.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [PUBLIC NAVBAR]                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PLATFORM                                                       LIGHT HERO   │
│  ────────                                                                    │
│                                                                              │
│  The platform underneath the intelligence.                                   │
│  Three-layer stack. Four agents. Built to ingest, reason, deliver.           │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ARCHITECTURE                                                   DARK SECTION │
│  ────────────                                                                │
│                                                                              │
│  Postgres holds the facts. Pinecone holds the meaning. The graph holds      │
│  the wisdom.                                                                 │
│                                                                              │
│  [Architecture diagram — three layers, agents on top, integrations around]   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AGENT ROSTER (4 cards)                                         DARK SECTION │
│  ─────────────                                                               │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │ NEXUS    │ │ SENTINEL │ │ ATLAS    │ │ STEWARD  │                         │
│  │ Programs │ │Intelligen│ │ Tower    │ │ Platform │                         │
│  │ Maestro  │ │ Library  │ │ CIO view │ │ Admin    │                         │
│  │ ...      │ │ ...      │ │ ...      │ │ ...      │                         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                         │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INTEGRATION CATALOG                                            LIGHT SECTION│
│  ──────────────────                                                          │
│                                                                              │
│  [Grid of connector logos grouped by category — EHR, ERP, FinServ, etc.]     │
│  [Custom integration SLA; webhook model; API surface]                        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SECURITY + COMPLIANCE                                          LIGHT SECTION│
│  ─────────────────────                                                       │
│                                                                              │
│  SOC 2 Type II — target Q4 2026 · HIPAA architecture target · BAA available  │
│  on request at Enterprise tier · Data residency options · Encryption at rest │
│  and in transit · Audit logging · Model provider posture (Anthropic primary) │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRICING                                                        DARK SECTION │
│  ───────                                                                     │
│                                                                              │
│  ┌─────────────────────┬─────────────────────┬─────────────────────┐         │
│  │ STARTER             │ GROWTH              │ ENTERPRISE          │         │
│  │ $350K/yr            │ $800K/yr            │ $1.6M/yr            │         │
│  │ 240 maestro hrs     │ 520 maestro hrs     │ 1,040 maestro hrs   │         │
│  │ 1 vertical          │ 2 verticals         │ Unlimited verticals │         │
│  │ [Request]           │ [Request]           │ [Request]           │         │
│  └─────────────────────┴─────────────────────┴─────────────────────┘         │
│                                                                              │
│  Overage: $1,500/maestro hour                                                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 · Admin

**Route:** `/admin` (ops) and `/tenant/{tenant_slug}/admin` (client)
**Who lands here:** Client admin (Connor), AbarVa ops.

Client-side admin (Connor's view):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Meridian Health › Admin                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────┬────────────────────────────────────────────────────┐ │
│ │ SIDEBAR            │ MAIN PANEL (context-dependent)                     │ │
│ │ ────               │ ────                                               │ │
│ │                    │                                                    │ │
│ │ Users              │ [Selected admin function renders here]             │ │
│ │ SSO / SCIM         │                                                    │ │
│ │ Data connectors    │ Example — Users view:                              │ │
│ │ Entitlement        │ ┌──────────────────────────────────────────────┐   │ │
│ │ Audit log          │ │ Users (247)                    [+ Invite]    │   │ │
│ │ Billing            │ │ Search: [____]  Role: All ▾  Status: All ▾  │   │ │
│ │ Support            │ │                                              │   │ │
│ │                    │ │ [Table: name, email, role, last active, status]│ │
│ │                    │ └──────────────────────────────────────────────┘   │ │
│ │                    │                                                    │ │
│ └────────────────────┴────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
```

**Content rules:**
- Sidebar nav always visible; active item highlighted.
- Main panel scrolls independently.
- All destructive actions (delete user, remove connector) require explicit confirmation with typed confirmation for high-impact actions.
- Every action writes to audit log (tamper-evident).

### 3.7 · Investor

**Route:** `abarva.ai/investors?access=<token>`
**Who lands here:** Investor (Jake). Gated.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [MINIMAL NAVBAR — no Programs/Tower/etc.]                                    │
│ [AbarVa]                                                      [Contact Anand]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INVESTOR                                                       LIGHT HERO   │
│  ────────                                                                    │
│                                                                              │
│  AbarVa · Seed round · $8M at $25M cap                                       │
│                                                                              │
│  The Harvey of enterprise transformation.                                    │
│  An $800B category, a moat that compounds, a product shipping today.         │
│                                                                              │
│  Last updated: Apr 22, 2026 · 7:22 PM                                        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CATEGORY THESIS                                                LIGHT        │
│  ────────────────                                                            │
│                                                                              │
│  What Harvey did for legal ($11B valuation, same structure), AbarVa does     │
│  for enterprise transformation — a category ~70x the TAM of legal.           │
│                                                                              │
│  [3-panel argument with numbers]                                             │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THE MOAT (4 compounding assets)                                DARK SECTION │
│  ───────────                                                                 │
│                                                                              │
│  1. Transformation Genome — 13 patterns live, target 50 by Series A          │
│  2. Adaptive Strategy Intelligence — cross-client reasoning graph            │
│  3. Outcome Interpretability Layer — dual-ledger reconciliation              │
│  4. Research Publication Program — category authority flywheel               │
│                                                                              │
│  [Each asset links to evidence: a pattern, a program path, a publication]    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRODUCT PROOF                                                  LIGHT SECTION│
│  ─────────────                                                               │
│                                                                              │
│  [Live demo links — click into the actual product]                           │
│  → Morrison Owned Brand Margin Recovery (Apex Retail · Phase 4)              │
│  → Ambient Clinical Value Chain (Meridian Health · Phase 3)                  │
│  → AI Control Tower (Meridian Health)                                        │
│  → Three canonical patterns                                                  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRACTION · WHAT'S REAL TODAY                                   DARK SECTION │
│  ────────────────────────────                                                │
│                                                                              │
│  PRODUCT                                                                     │
│  Live at app.abarva.ai · 4 composite reference tenants in the build ·        │
│  Morrison Owned Brand Margin Recovery program being built to Rich-fidelity   │
│  reference standard · Control Tower with editorial POV live in preview       │
│                                                                              │
│  INTELLIGENCE                                                                │
│  13 pattern packs authored · 5 universal + 8 vertical · Spec depth           │
│  matching research-institute standard · Pattern library navigable today      │
│                                                                              │
│  PIPELINE (named, in progress — no signatures yet)                           │
│  • Prat (Fortune 40 CIPO) — design partner conversation advancing            │
│  • Anthology Fund — seed investor outreach scheduled post-demo               │
│  • Shail Jain — seed angel + advisor (committed)                             │
│                                                                              │
│  NOT YET · the honest column                                                 │
│  Zero paying customers · Zero signed design partner agreements ·             │
│  Zero deployed production outcomes · SOC 2 target Q4 2026                    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MILESTONE PATH · TARGETED                                      LIGHT SECTION│
│  ─────────────────────────                                                   │
│                                                                              │
│  NEXT 90 DAYS (with seed)                                                    │
│  • First signed design partner (target: Prat org)                            │
│  • Seed round closed at $8M / $25M cap                                       │
│  • Pattern count to 20 · First production deployment begins                  │
│                                                                              │
│  NEXT 12 MONTHS                                                              │
│  • 3-5 design partners in active delivery                                    │
│  • First outcome attestation completed (dual-ledger reconciliation)          │
│  • Pattern count to 35-50 · Cross-client intelligence begins compounding     │
│  • SOC 2 Type II achieved                                                    │
│                                                                              │
│  SERIES A TRIGGER                                                            │
│  $5M ARR run-rate → $100M pre-money target                                   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TEAM                                                           LIGHT SECTION│
│  ────                                                                        │
│                                                                              │
│  Anand Sundaram · Founder · [pedigree]                                       │
│  Advisors: Shail Jain, [others]                                              │
│  Hire plan post-seed: [key roles]                                            │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THE ASK                                                        DARK SECTION │
│  ────────                                                                    │
│                                                                              │
│  $8M at $25M cap                                                             │
│                                                                              │
│  Use of proceeds (3 categories with %)                                       │
│  Milestones to Series A                                                      │
│                                                                              │
│  [Request data room access →]                                                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FAQ                                                            LIGHT SECTION│
│  ───                                                                         │
│                                                                              │
│  [Accordion: Q / A pairs — the questions every investor asks]                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [MINIMAL FOOTER — contact, data room request, no social links]               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Content rules:**
- Last updated timestamp at top — signals the page is alive.
- Every claim has a link to supporting evidence.
- Live product links open in new tabs — the investor can click through and return.
- Data room request is the primary late-stage action; not a sales call.
- No forms inline; contact is email or Calendly (human touch).

**Content honesty notes (Investor — the most scrutinized surface):**
- **Two-column traction frame.** Every traction page shows both "What's real today" and "Not yet · the honest column." This inoculates against investor surprise and builds conviction through integrity.
- **No fabricated MOUs or signed design partners.** Until signatures exist, these stay in the pipeline column with named conversations only.
- **No revenue numbers, no ARR, no run-rate.** Zero is zero — don't decorate it. Milestones expressed as target dates.
- **Composite tenant disclaimers** on every live product link. "Click into Morrison" must make clear Morrison is a composite demo built from real-world data.
- **Named people in pipeline** (Prat, Anthology, Shail) only if the person has consented to being named in investor materials. If Anand hasn't asked, use role-level framing ("Fortune 40 CIPO in active conversation," "Tier-1 seed fund outreach scheduled").
- **No customer logos at any tier.** Only when signed contracts exist.
- **Compliance posture** framed as architecture target with dates, never implied to be achieved.
- **Velocity signal.** "Last updated" timestamp updates between investor visits with real additions (new pattern shipped, new design partner conversation advanced, new research publication) — never with fabricated traction.

---

## Part 4 · Persona Journey Maps

Each journey is expressed as a sequence of steps: who · where · what they see · what they click · what happens next.

### 4.1 · CXO journey · Monday morning Tower check

**Persona:** Prat (CXO). 3-5 min window before first meeting.
**Goal:** Know what's on fire. Assign owners or open programs for two-three things. Leave.

| # | Location | What they see | What they click | What happens |
|---|---|---|---|---|
| 1 | Email / bookmark | Direct URL to `/tenant/meridian-health/tower` | Link | Lands on Control Room |
| 2 | Control Room | Top metrics strip; three pressure cards with $ amounts and editorial lines; KPI strip | Scans for 15-20s | Spots the ambient vendor pressure card ($522K/mo) |
| 3 | Control Room | "Three ambient-documentation tools, one problem, no owner" pressure card | `[OPEN →]` | Opens the vendor overlap detail (Vendor Portfolio sub-surface filtered to this recommendation) |
| 4 | Vendor Portfolio | Overlap matrix highlighting ambient · Rationalization recommendation · Savings $174K/mo | `[Open recommendation →]` | Opens the program seed page for "Ambient Documentation Vendor Strategy" |
| 5 | Program page (MRD shadow) | Phase 0 · Start · recommendation context · estimated timeline | `[Assign owner]` | Modal: select owner from council roster |
| 6 | Modal | Dropdown of council members | Selects CMIO | Owner assigned; pressure card in Tower will now show as owned |
| 7 | Control Room (auto-return) | Pressure card 3 now shows CMIO as owner | Back to scan | Spots pressure card 1 ($1.3M AI cloud spend) as still unowned |
| 8 | Control Room | `[Assign owner]` on card 1 | Selects CFO + CIO co-owner | Owner assigned |
| 9 | Control Room | Two pressures now owned; third is strategic (council decision required) | Notes for Apr 24 council | Close tab |

**Outcome:** 4 minutes. 2 owners assigned. 1 council item flagged. Tower delivered the signal in 20 seconds of scanning.

### 4.2 · CXO journey · Phase 3 program interview

**Persona:** Dr. L (CMIO at Meridian). Booked 30-minute Phase 3 interview for Ambient program.
**Goal:** Review the decision memo, ask questions, approve or redirect.

| # | Location | What they see | What they click | What happens |
|---|---|---|---|---|
| 1 | Calendar | Phase 3 interview link | Link | Lands on `.../programs/ambient-clinical-value-chain/phase/3` |
| 2 | Phase 3 view | Gate readiness: 4 of 6 ready, 1 pending CMIO (D17). Gate criterion stated. | `D17 Decision Memo` | Opens D17 at Rich fidelity |
| 3 | D17 deliverable page | Executive summary. KPI strip: $6.8M capital, $14-22M/yr outcome, 9-14 mo payback, HIGH risk | Reads exec summary | — |
| 4 | D17 | Recommendation section. Vendor comparison table. Projected outcome chart. | Drills into vendor comparison | Sortable table renders |
| 5 | D17 | Notices "Abridge vs DAX risk tier differential." | Hovers `Risk tier` chip | Tooltip: explains the differential with link to risk register |
| 6 | D17 | `[Request Nexus regeneration]` button | Clicks | Modal: "What would you like Nexus to reconsider?" |
| 7 | Modal | Free-text + dropdown suggestions | Types "Revisit outpatient sequencing — I want Phase 4, not Phase 5" | Submits |
| 8 | D17 | Regeneration queued. Banner: "Nexus regenerating · ~2 min." | Continue reading | D17 updates in place when ready |
| 9 | D17 (regenerated) | New recommendation with outpatient in Phase 4. New capital estimate. | `[Send to Dr. L for review]` (self-send confirms) | Maestro Maya notified |
| 10 | D17 | `[Approve for phase gate]` button | Clicks | Phase 3 now ready to close; Phase 4 kickoff scheduled |

**Outcome:** 18 minutes. One major redirect integrated. Phase gate approved. Maestro notified. No email thread.

### 4.3 · Maestro journey · New program intake

**Persona:** Maya (maestro). Taking a brand new program intake call with a Meridian exec.
**Goal:** Capture enough signal to generate a charter; get aligned on archetype and scope.

| # | Location | What they see | What they click | What happens |
|---|---|---|---|---|
| 1 | Programs index | `[+ Start new program]` button | Clicks | Maestro Intake Interface opens (conversational) |
| 2 | Intake Interface | "Tell me about the problem you're trying to solve." | Types or dictates the exec's problem statement | — |
| 3 | Intake Interface | Parses problem · suggests 2-3 matching patterns · asks 3-4 diagnostic questions | Answers questions | — |
| 4 | Intake Interface | Proposes archetype (OO), scope (ambulatory first), sponsor, success metric | Confirms or edits | — |
| 5 | Intake Interface | Generates draft charter (D01) with tenant-specific bindings | Reviews draft | Looks good |
| 6 | Intake Interface | `[Create program]` | Clicks | Program created; redirects to new program page |
| 7 | Program page | Phase 1 in progress. 4 Phase 1 deliverables listed (D01 done, D02/D03/D04 pending). | Opens D02 Stakeholder Map | — |
| 8 | D02 page | Stub state for some details; starter structure from pattern library | Fills in stakeholder list | Saves |

**Outcome:** 20 minutes, program exists, charter drafted, intake synthesis in flight. Zero manual setup.

### 4.4 · Maestro journey · Mid-program pattern consult

**Persona:** Maya. Working on a Phase 3 deliverable for the Ambient program. Hits a wall.
**Goal:** Pull relevant intelligence without losing context.

| # | Location | What they see | What they click | What happens |
|---|---|---|---|---|
| 1 | D15 Intervention Portfolio (Ambient) | Section for HCC coding integration — needs clarity on sequencing | Inline "Relevant pattern" chip | Side drawer opens with pattern excerpt |
| 2 | Side drawer | Pattern: Ambient Clinical Value Chain · Section E (Interventions) · relevant portion extracted | `Open full pattern` | New tab: full pattern page |
| 3 | Pattern page | Sidebar nav · jumps to Section E | Reads | — |
| 4 | Pattern page | Section I (Observations) — "Composite health system Beta integrated HCC in Phase 3, not Phase 4 — savings accrued 9 months earlier" | Copies observation reference | — |
| 5 | Back to D15 tab | Pastes observation reference inline; decision logged | Saves | Observation cross-linked both directions |

**Outcome:** 12 minutes. Context preserved. Pattern invoked, evidence captured, deliverable strengthened.

### 4.5 · Investor journey · First visit (cold diligence)

**Persona:** Jake (Anthology Fund). Has a token. First time on the page. 25 min window.
**Goal:** Decide whether to take a call.

| # | Location | What they see | What they click | What happens |
|---|---|---|---|---|
| 1 | Email from Anand | Token link | Clicks | Lands on Investor page |
| 2 | Investor hero | "Seed round · $8M at $25M cap · The Harvey of enterprise transformation" · Last updated timestamp | Reads hero (15s) | Hooks on Harvey analogy |
| 3 | Category thesis | 3-panel argument with numbers | Reads | Believes the framing |
| 4 | The Moat section | 4 compounding assets with evidence links | Clicks "Transformation Genome → 13 patterns live" | Opens Intelligence library in new tab |
| 5 | Intelligence library (new tab) | Pattern cards · Ambient Clinical · Analytics Modernization · etc. | Clicks Ambient Clinical | Pattern detail opens |
| 6 | Pattern detail | Long-form, rigorous, cited. Sidebar nav shows depth. | Scrolls quickly through sections | Depth confirmed; not a glossary |
| 7 | Back to Investor page | Product proof section | Clicks "Morrison Owned Brand Margin Recovery" | Opens Apex / Morrison program in new tab |
| 8 | Morrison program page | Rich rendering, 5-phase timeline, current Phase 4, projected outcome, decision log | Opens D17 Morrison decision memo | D17 renders at Rich fidelity |
| 9 | D17 | Exec summary, KPI strip, vendor comparison, chart, decision log | Reads exec summary | Believes product is real |
| 10 | Back to Investor page | The Ask section | Reads | Ready to take a call |
| 11 | Investor page | "Contact Anand" | Clicks | Email opens (pre-filled) |

**Outcome:** 25 minutes. Conviction built enough for first call. Jake has seen pattern depth, product fidelity, and commercial framing.

### 4.6 · Investor journey · Return visit (day 7)

**Persona:** Jake. Revisits before partner meeting. Checking what's changed.

| # | Location | What they see | What they click | What happens |
|---|---|---|---|---|
| 1 | Token link | Lands on Investor page | — | — |
| 2 | Investor hero | "Last updated: Apr 29" (4d later) | Scans for changes | — |
| 3 | Velocity signals | New: "2 new patterns authored · Vendor Portfolio sub-surface shipped on Control Tower · research note published" · pipeline column updated: design partner conversation advanced (unsigned, named at role level if not consented) | Clicks new research note | Blog post or publication link |
| 4 | FAQ | Reads 3 questions | Ready to answer partner Q's | — |
| 5 | Data room | Clicks "Request data room access" | Opens form (minimal — 2 fields) | Request submitted |

**Outcome:** 12 minutes. Velocity signal received. Partner meeting prep done. Data room requested.

### 4.7 · Design partner journey · Technical evaluation

**Persona:** Dara (enterprise architect). 20 min initial evaluation before recommending up.
**Goal:** Determine if this is real engineering.

| # | Location | What they see | What they click | What happens |
|---|---|---|---|---|
| 1 | Home | Hero + category thesis | "How it works" CTA | Platform page |
| 2 | Platform | Architecture section with three-layer stack diagram | Reads | Technical framing credible |
| 3 | Platform | Agent roster · 4 agent cards | Reads Nexus card | Agent has prompts, latency budget, eval — not black box |
| 4 | Platform | Integration catalog | Scans for EHR, ERP | Epic + Cerner listed; SAP listed |
| 5 | Platform | Security + compliance | SOC 2 Type II (in progress, target date) | Honest, not overclaimed |
| 6 | Platform | Pricing tiers with bundled hours | Reads | Transparent pricing — unusual for category |
| 7 | Platform | `[Request technical deep dive]` | Clicks | Calendly link |

**Outcome:** 18 minutes. Technical credibility established. Will escalate up.

### 4.8 · Client admin journey · Data connector setup

**Persona:** Connor (IT admin at Meridian). Needs to configure Epic FHIR connector.
**Goal:** Get connector live and validated.

| # | Location | What they see | What they click | What happens |
|---|---|---|---|---|
| 1 | Admin email | SSO link from Maya | Link | Lands on `/tenant/meridian-health/admin` |
| 2 | Admin sidebar | Users · SSO/SCIM · Data connectors · Entitlement · Audit log · Billing · Support | `Data connectors` | Main panel loads connector list |
| 3 | Data connectors | Epic FHIR shown as "Not configured" | `Configure` | Connector setup wizard opens |
| 4 | Wizard step 1 | Endpoint URL, client ID, client secret | Fills in | — |
| 5 | Wizard step 2 | Scope selection (patient, encounter, condition, observation, etc.) | Selects 6 scopes | — |
| 6 | Wizard step 3 | Test connection | Passes | Green check |
| 7 | Wizard step 4 | Sync schedule (hourly, daily, on-demand) | Hourly | Saved |
| 8 | Data connectors | Epic FHIR shown as "Active · last sync 2m ago" | — | Done |

**Outcome:** 8 minutes. Connector live. Validated. Audit log captures the action.

---

## Part 5 · Critical Click Paths

The sequences that MUST work flawlessly. Every demo rehearsal walks these. Every CI audit validates these.

### 5.1 · Prat demo golden path

**Context:** Prat demo. Anand driving. ~30 min demo window. Target: Prat believes Morrison works and Control Tower is Monday-morning-real.

1. Home (light hero) — 30 seconds context setting on the category
2. Click "See it in action" → Apex Retail dashboard
3. Apex dashboard → Programs index → shows 6 Apex programs with phase spread
4. Click Morrison (APX-01) → Morrison program page
5. Phase 3 → D17 Morrison Decision Memo (Rich) — the document Prat would actually read
6. Click the source pattern → Owned Brand Margin Recovery pattern page
7. Click "analogous programs" → Ambient program (Meridian) opens in side panel or new tab
8. Back to Apex → Click "Control Tower" in nav
9. Apex Control Tower (Control Room view) — pressures, KPIs, the editorial POV
10. Click a pressure card → drill into vendor or program
11. Close the loop — Apex dashboard, summary of what we saw

**Acceptance criteria:**
- Every click under 1.5s to first paint
- Every page at Rich fidelity
- Zero 404s
- Cross-links work both ways
- Tenant switcher correct

### 5.2 · Morrison end-to-end walkthrough

**Context:** Technical buyer or design partner deep-dive. ~45 min.

- Apex dashboard → Programs → Morrison
- Morrison Phase 1 → D01 charter → D02 stakeholders → D03 metric tree → D04 intake synthesis
- Phase 2 → D07 financial baseline → D08 pain register → D09 RCA → D10 benchmark → D11 hypotheses
- Phase 3 → D12 estimation roadmap → D15 intervention portfolio → D16 business case → D17 decision memo → D18 risk register
- Phase 4 → D19 delivery plan → D20 sprint artifacts → D24 outcome measurement plan
- Phase 5 stubs (showing they're scheduled, not broken)
- Back to Morrison page → decision log → cross-links to pattern and analogous programs

All Rich. All cross-links working. Print view on D17.

### 5.3 · Anthology Fund investor deep read

**Context:** Jake has token. Full diligence session. ~40 min.

1. Investor page → hero, category thesis, moat, product proof
2. Morrison program (via product proof link, new tab) → Phase 4 deliverables at Rich
3. Return to Investor → traction, team
4. Control Tower (via product proof link, new tab) → Meridian Control Room view
5. Return to Investor → the ask, use of proceeds
6. FAQ — 5-8 Q/As
7. Request data room → form submission

Every live link works. Timestamps show page is alive. Data room request flows to Anand directly.

### 5.4 · Error recovery paths

When things go wrong, users land here:

- **404:** never shown. Routes resolve to Stub or redirect.
- **Auth expired:** redirects to sign-in with deep-link preservation.
- **Stub page:** first-class; shows scheduled state with trigger conditions.
- **Nexus regeneration in progress:** inline banner on deliverable; content doesn't disappear mid-read.
- **Connector sync error:** loud inline error in Admin; muted/hidden from CXO-facing surfaces.

---

## Part 6 · Mobile treatment

Mobile is responsive, desktop is primary for authenticated surfaces. Specific mobile rules:

- **Home, Platform, Investor:** full mobile parity. These are acquisition surfaces.
- **Programs:** mobile renders program list and program page well; deliverable pages condense; complex tables become card stacks; charts resize.
- **Control Tower:** mobile-optimized for the Control Room view (CXO checks during day). Sub-surfaces (Shadow AI, Vendor Portfolio, etc.) collapse to simplified views; complex matrices become scrollable cards.
- **Intelligence:** library browseable; pattern pages readable with sidebar converted to top-of-page accordion.
- **Admin:** desktop-primary. Mobile view shows read-only state plus audit log. No provisioning on mobile.

---

## Part 7 · Content authoring guardrails (integrity layer)

A checklist the author, the agent, and the reviewer run before any content ships to a public or gated surface. Short, binary, enforceable.

### Forbidden content (no exceptions until conditions are met)

| Forbidden | Until this condition is met |
|---|---|
| Customer logos | At least one paying customer exists with logo usage rights |
| Testimonials | Real customer provides written testimonial with consent |
| "Trusted by" / "Used by" strips | At least 3 named paying customers exist |
| Named design partners | Signed design partner agreement exists AND the partner has consented to being named |
| MOU, LOI, or contract claims | The document exists, is signed, and the counterparty has consented to public reference |
| Revenue, ARR, run-rate numbers | Revenue is actually recognized under contract |
| Case studies | A program has reached Phase 5 outcome attestation with a real client who consented to publication |
| "Outcomes delivered" / "savings realized" | Dual-ledger reconciliation completed with a real client and attested in writing |
| SOC 2 Type II claim | Certification issued (not "in progress," not "underway") |
| HIPAA certified claim | BAA executed with a real customer AND compliance audit completed |
| Generic "enterprise AI leader" / "category-defining" language | Self-congratulatory framing; not forbidden but discouraged — prefer specific claims with evidence |

### Approved content patterns

| Pattern | Framing |
|---|---|
| Product reality | "Live at app.abarva.ai — see for yourself" (links to composite demo) |
| Pattern library depth | "13 patterns authored · spec-grade" (count is real; they are authored content) |
| Composite reference tenants | "4 composite organizations built from real-world data" (explicit every time) |
| Pipeline | Role-level by default ("Fortune 40 CIPO in active conversation"); named only with consent |
| Advisor / angel | Named with consent (Shail Jain consented) |
| Architecture claims | Fine — architecture exists and can be shown |
| Pricing | "Offered model" — fine. No "Enterprise customers on this tier" unless they exist. |
| Roadmap / milestones | Target dates, labeled as target |
| Research publications | Real when published; link to the publication |
| Velocity signals between visits | Real additions (new pattern, new sub-surface, new research); never fabricated traction |

### Language audit rules

- Replace "customers" with "composite reference tenants" when no customers exist.
- Replace "we deliver outcomes" with "the platform is designed to deliver outcomes" until outcomes are attested.
- Replace "our clients" with "the programs we have built" when describing composite demos.
- Replace "trusted by leading enterprises" with nothing. Delete the sentence. Say something specific instead.
- Replace "X% of enterprises" claims with cited research from third parties, or remove.
- Replace "proven" with "designed to," "built to," or "structured around" until proof exists.

### The Prat/Anthology test

Before publishing any page content, run this test:
- *If Prat clicked this sentence and asked Anand at dinner, "is this real?" — what would Anand say?*
- *If Anthology's lead partner cited this claim in their investment memo, would it survive reference checks?*

If either answer is "well, not yet" or "we'd have to explain," the content does not ship in that form.

### Post-seed content unlocks

When these events occur, specific content categories unlock:

| Event | Unlocks |
|---|---|
| First design partner signs + consents to naming | Named design partner on Home and Investor |
| First paid customer signs | "Customers" terminology; first logo if consented |
| First Phase 5 attestation completed | First case study; "outcomes delivered" framing |
| 3+ customers with logo consent | "Trusted by" strip on Home |
| SOC 2 Type II issued | SOC 2 claim on Platform page |
| BAA executed + HIPAA audit completed | HIPAA certified claim on Platform page |
| $1M+ ARR | Revenue framing appropriate on Investor page |

Every content unlock is a real event, not a marketing decision.

---

## Summary

- **Content integrity layer (Part 0.5 + Part 7) is now the highest-priority authoring contract.** AbarVa is pre-seed, pre-customer; every Home/Platform/Investor line is audited against "what is real today vs. aspirational." Forbidden content (customer logos, testimonials, fabricated MOUs, revenue numbers) is listed explicitly with unlock conditions. No exceptions.
- **Five personas** capture the product's users. Every wireframe and journey tested against these.
- **Wireframes** specified for all 7 pages with multi-view coverage for Programs, Intelligence, and Control Tower. Block-level structure; content hierarchy; interactive elements; responsive rules. Home, Platform, and Investor wireframes now carry explicit content honesty notes.
- **Journey maps** for each persona's canonical scenarios — 8 journeys covering CXO, Maestro, Investor, Design Partner, and Client Admin paths. Investor return journey updated to reflect real velocity signals (new patterns, new sub-surfaces, research publications) — not fabricated MOUs.
- **Critical click paths** for the Prat demo, Morrison end-to-end walkthrough, and Anthology investor deep read — the sequences that must be flawless.
- **Control Tower** is the biggest multi-surface design commitment: Control Room as default landing plus five sub-surfaces (Shadow AI, Vendor Portfolio, Regulatory Posture, AI Council, Model Inventory). Tower is the CIO-resonant surface and must be built out at the same editorial fidelity as the current Control Room.
- **Mobile** parity for acquisition surfaces; desktop-primary for working surfaces; Admin is desktop-only for provisioning.
- **Content unlocks** tied to real events (first signed partner, first paid customer, first Phase 5 attestation, SOC 2 issued, HIPAA audited, $1M ARR). Marketing/design cannot unilaterally unlock content categories — real events do.

This document is the design + content contract. The companion `page-strategic-purpose-definition.md` is the strategic contract. Together they fix why each page exists, how it should be built, and what words are allowed to go into it at current stage.

---

*End of Wireframes & Persona Journey Maps.*
