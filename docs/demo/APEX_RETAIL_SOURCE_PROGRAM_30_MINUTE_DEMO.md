# Apex Retail — Source + Program 30-Minute Demo Guide

Wave 19 · DEMO7 | 2026-04-26

---

> **Caveat: All data shown is deterministic seed data for demonstration purposes only.**
> No real vendor names, real pricing, real procurement outcomes, or live data ingestion are represented.
> Numeric values, postures, and decisions are authored as representative demonstration seeds.

---

## Opening Narrative

**Position AbarVa for the prospect:**

"AbarVa is a Nexus-led procurement intelligence platform. It sits at the intersection of three things that enterprise procurement teams currently manage in silos: the programme of work delivering the business outcome, the commercial sourcing event producing the vendor decision, and the agent intelligence connecting them in real time.

What you are about to see is the Apex Retail demonstration environment. Apex Retail is a large retail enterprise running a Customer Data Platform activation programme — a £multi-million transformation spanning six delivery phases. At the same time, they are mid-way through a competitive vendor consolidation for their Application Management Services estate. These two workstreams are not independent. The AMS vendor decision directly affects the programme's commercial readiness gate.

AbarVa makes that dependency visible, traceable, and actionable. That is what makes it a system rather than a set of tabs."

---

## 10-Minute Version

*Best for: warm prospects, repeat visitors, or a focused executive slot.*

### Route Sequence

| Step | URL | Time | What to Show |
|------|-----|------|--------------|
| 1 | `/tenant/apex-retail/programs` | 2 min | Programs portfolio overview — 4 active programmes, phase distribution |
| 2 | `/tenant/apex-retail/programs/[cdp-slug]` | 4 min | CDP Activation flagship — Synthesis phase active, gate status, top action |
| 3 | `/source/events/apex-retail-ams-outsourcing-2026` | 3 min | AMS Commercial Event — linked programme badge (APX-CDP-2026), vendor comparison, top risk |
| 4 | Close | 1 min | Narrative close |

### Step 1: Programs Portfolio (2 min)

Open `/tenant/apex-retail/programs`.

- Point to the programme count and phase distribution.
- "Apex Retail has four active programmes in flight. The CDP Activation programme is in its Synthesis phase — discovery is complete, the gate to Design is pending evidence consolidation."
- Do not dwell. Move directly to the flagship.

### Step 2: CDP Activation Flagship (4 min)

Open the CDP Activation programme detail page.

- Point to the **phase rail**: six phases, Synthesis currently active.
- Point to the **gate status chip**: pending — 3 evidence items remaining.
- "The gate to Design is pending. Three items remain: synthesis workshop attendees unconfirmed, evidence trace missing for the value hypothesis deliverable, and the executive sponsor BAFO position is not yet recorded."
- Point to the **recommended next action**: "Schedule Workshop 5 — Synthesis."
- Point to the **source event chip** in the action strip: "This programme is informed by a live commercial event. Let me show you that now."

### Step 3: AMS Source Commercial Event (3 min)

Open `/source/events/apex-retail-ams-outsourcing-2026`.

- Point to the **linked programme badge**: APX-CDP-2026. "AbarVa knows this event informs that programme."
- Point to the **vendor comparison**: four vendors — Vendor Alpha (complete), Vendor Beta (partial), Vendor Gamma (partial), Vendor Delta (missing rate card).
- Point to the **top risk**: "Rate card gap — Vendor Delta. Cannot proceed to normalised comparison without a complete submission."
- "The BAFO cannot close until Vendor Delta responds. The programme gate cannot advance until the BAFO provides commercial evidence for the value hypothesis."

### Step 4: Close (1 min)

"This is the Source → Programme narrative that AbarVa enables. The commercial sourcing event and the delivery programme are not two separate workstreams — they are one connected decision chain. AbarVa surfaces that chain, the agents track it, and the gate only moves when the evidence arrives. That is what Nexus-led procurement intelligence looks like."

---

## 30-Minute Version

*Best for: discovery meetings, first enterprise demos, or structured product reviews.*

### Section 1: Programs Portfolio (5 min)

**Route:** `/tenant/apex-retail/programs`

**What to show:**
- Programme count (4 active programmes for Apex Retail in the seed)
- Phase distribution across the portfolio
- Programme health indicators
- Navigation to the flagship CDP Activation entry

**Narration:**

"Apex Retail has four active programmes in flight across their transformation portfolio. You can see the phase distribution — some programmes are in early Discovery, the flagship CDP Activation is in Synthesis. The platform gives the programme owner an immediate read of where each workstream is, what health state it is in, and what is blocking forward motion.

This is the control layer. Let me take you into the flagship programme."

---

### Section 2: Programme Flagship — CDP Activation (10 min)

**Route:** `/tenant/apex-retail/programs/[cdp-slug]`

**Programme reference:** APX-CDP-2026

#### 2a. Phase Rail (2 min)

- Point to the **phase rail**: Discovery, Synthesis, Design, Build, Validate, Operate.
- "Six phases. Discovery is complete. We are in Synthesis. The Design gate is pending."
- "This is an 18-month programme. Workshop 4 was the final Discovery workshop. Workshop 5 is the Synthesis session — it has been scheduled but attendees are not yet confirmed."

#### 2b. Gate Status (2 min)

- Point to the **gate status section**: "Gate: Design — pending. 3 items remaining."
  1. Synthesis workshop attendees confirmed — blocked on two named SMEs who have not confirmed availability (Steward is the unblocking agent).
  2. Evidence trace for value-hypothesis deliverable — source citations not yet consolidated (Sentinel is the unblocking agent).
  3. Executive sponsor BAFO position — sponsor has not recorded a Best-And-Final-Offer position to anchor commercial framing (Atlas is the unblocking agent).
- "None of these are technical blockers. They are governance and evidence blockers. AbarVa surfaces them so the programme manager does not have to chase status in a spreadsheet."

#### 2c. Workshop 5 Outcomes (2 min)

- Reference Workshop 5 (Synthesis — held 2026-04-18):
  - 3 decisions reached: CDP readiness first, AMS vendor consolidation as commercial input to the programme, value baseline evidence required before gate advances.
  - Tension resolved: sequencing vs urgency — the programme team agreed to sequence the BAFO outcome before advancing the gate rather than moving forward on assumption.
  - Gate narrative: "The gate remains pending because 3 evidence items have not yet been consolidated post-workshop."
- "This is what a Nexus-led programme looks like 18 months in. The decisions are recorded. The gate is honest. The agents know what is blocking it."

#### 2d. Deliverables Roadmap (2 min)

- Point to the **deliverables panel**: 14 deliverables across 6 phases.
  - Discovery phase: complete, evidence approved.
  - Synthesis phase: in-review, 2 items missing evidence.
  - Design through Operate: named, draft status, evidence not yet captured.
- "14 deliverables. Evidence coverage at approximately 36% — honest, because the programme is mid-stream. The roadmap is real even when the evidence is not yet attached. The platform does not fabricate coverage it does not have."

#### 2e. Source Event Chip (2 min)

- Point to the **source event chip** in the action/mission strip.
- "This programme is informed by a live commercial event. The AMS vendor consolidation is the procurement event that provides commercial evidence for Workshop 5's third decision — the BAFO outcome. Let me show you that event."

---

### Section 3: Source Commercial Event — AMS Vendor Consolidation (10 min)

**Route:** `/source/events/apex-retail-ams-outsourcing-2026`

**Event reference:** Application Management Services — Vendor Consolidation 2026

#### 3a. Linked Programme Badge (1 min)

- Point to the **linked programme badge**: APX-CDP-2026.
- "AbarVa has linked this sourcing event to the CDP Activation programme. The commercial outcome here is a gate input there. That is the cross-surface thread."

#### 3b. Vendor Comparison (3 min)

Four vendors in the AMS consolidation:

| Vendor | Pricing Status | Missing Sections |
|--------|---------------|-----------------|
| Vendor Alpha (Northstar) | Complete | None |
| Vendor Beta (BluePeak) | Partial | L3 support rate card, knowledge transfer costs |
| Vendor Gamma (Horizon) | Partial | Transition management costs |
| Vendor Delta (Meridian Systems) | Missing | Full rate card, SLA commercial framework, rebate structure |

- "Vendor Alpha is complete. Vendors Beta and Gamma are partial — missing specific line items. Vendor Delta has not submitted a complete rate card. The BAFO cannot close until Vendor Delta responds."
- Point to the **commercial assumptions** divergence: "Different vendors have applied different offshore ratios, making direct comparison impossible until normalisation is done. That is Atlas's job."

#### 3c. Commercial Risks (2 min)

Five risks surfaced:

| Risk | Severity | Category |
|------|----------|----------|
| Incomplete rate card coverage | High | Pricing |
| Assumption divergence across vendors | Medium | Commercial |
| Transition cost opacity | High | Transition |
| SLA rebate structure absent for two vendors | Medium | Governance |
| Knowledge transfer cost unknown for Vendor Beta | Low | Evidence |

- "Two high-severity risks, two medium, one low. The pricing gap and the transition opacity are the blockers. The governance gap and the evidence gap will surface at BAFO if not resolved now."

#### 3d. BAFO Readiness Signals (2 min)

Four signals:

1. **Rate card gap — Vendor Delta** (critical): Cannot proceed to normalised comparison.
2. **Offshore ratio divergence** (warning): Normalisation required before BAFO.
3. **BAFO scope partially confirmed** (warning): Confirmed for Vendor Alpha and Beta only. Vendor Gamma and Delta pending.
4. **Rebate framework absent** (info): Two vendors have not provided SLA rebate structures.

- "BAFO readiness is partial. Two vendors are not ready. The critical signal is Vendor Delta's missing rate card. Until that arrives, the BAFO cannot close, and the programme gate cannot advance."

#### 3e. Agent Mission Queue (2 min)

Five missions in queue:

| Agent | Mission | Priority |
|-------|---------|----------|
| Nexus | Request complete rate card from Vendor Delta | High |
| Sentinel | Validate L3 support rate card from Vendor Beta | High |
| Atlas | Normalise offshore cost assumptions across all vendors | Medium |
| Steward | Confirm SLA rebate framework with Vendor Alpha and Gamma | Medium |
| Nexus | Prepare executive decision brief pending Vendor Delta clarification | Low |

- "Nexus is orchestrating the response. Sentinel is validating the submissions. Atlas is normalising the assumptions. Steward is chasing the governance gaps. This is the agent model — not a single AI doing everything, but a coordinated agent team each working their lane."

---

### Section 4: Closing Narrative (5 min)

#### The Cross-Surface Story

"What happens when the BAFO completes?

Vendor Delta submits their rate card. Sentinel validates it. Atlas normalises it alongside the other three vendors. Nexus prepares the executive decision brief. The programme sponsor records their BAFO position. The evidence trace for the value hypothesis deliverable gets populated. Two of the three gate items resolve.

The programme gate advances to Design.

That is not a series of manual updates across three different systems. That is one connected decision chain with agents tracking every dependency. That is AbarVa.

Today you are seeing the demonstration layer — deterministic seed data that represents that chain accurately. What a pilot engagement unlocks is live procurement data: real BAFO submissions, real programme gate evidence, real value hypothesis validation."

#### Pilot Ask

"Sign Apex Retail as a pilot client.

What you see today is the demonstration layer. Pilot engagement connects live procurement data, enabling real BAFO evidence, real value hypothesis validation, and real programme gate progression.

The four pilot readiness items we would activate together:
1. **Live data ingestion** — connecting your procurement data sources to the AbarVa evidence layer.
2. **BAFO engine wiring** — connecting real vendor submissions to the commercial intelligence surface.
3. **Azure private data plane** — deploying within your security boundary so no procurement data leaves your environment.
4. **Procurement owner access** — onboarding your programme managers and procurement leads as named users with appropriate roles.

The platform is ready for a pilot. The question is whether Apex Retail is ready to move from demonstration to discovery."

---

## 45-Minute Deep Dive

*Best for: technical evaluations, architecture reviews, or enterprise security conversations.*

Start with the complete 30-minute version above, then extend with the following sections.

### Extension 1: Control Tower — Signal Intelligence (5 min)

**Route:** `/control-tower` (thin surface — ready)

- Show the portfolio-level signal feed.
- Point to the AMS event signals surfacing at the tower level: pricing gap, assumption divergence, BAFO readiness.
- "The Control Tower is the executive read of the entire procurement intelligence estate. Individual source events and programme signals aggregate here. When the pricing gap at the AMS event becomes critical, the tower surfaces it without the executive needing to drill into the event."
- Caveat: "This surface is present and seeded. Live signal ingestion from real procurement systems is a pilot activation item."

### Extension 2: Intelligence — Pattern Detection (5 min)

**Route:** `/intelligence` (thin surface — ready)

- Show the intelligence surface and pattern detection layer.
- "Intelligence is where AbarVa detects patterns across your procurement history. Vendor assumption divergence — like the offshore ratio divergence we saw in the AMS event — is a pattern that repeats across vendor consolidations. Intelligence surfaces it proactively rather than waiting for a risk register entry."
- Caveat: "Pattern detection on live historical data is a pilot activation item. The demonstration surface shows the analytical vocabulary."

### Extension 3: Architecture Canvas (5 min)

**Route:** `/platform/admin/architecture` (ready)

- Show the 9-plane architecture canvas.
- Walk the control plane / data plane separation.
- Point to the model gateway and the agent dispatch layer.
- "This is the blueprint for the private data plane deployment. Everything you see running today in shared SaaS can be moved inside your Azure VNet — the compute, the database, the model gateway, the audit logs. No procurement data leaves your boundary."
- Reference the four-tier deployment strategy (SaaS pilot → dedicated tenant → private data plane → air-gapped).

### Extension 4: Production Readiness (5 min)

**Route:** `/platform/admin/production-readiness` (ready)

- Show the production readiness surface honestly.
- "This is the production readiness tracker. I am going to show you this because honest disclosure is part of the AbarVa operating model.
  - The demonstration surface is complete. Every route you have seen today is real running software.
  - The production deployment is staged. Live provider polling, CI/CD automation, and observability ingestion are not yet wired.
  - The honest blockers: deploy verification, real data ingestion, live agent model gateway routing.
  - These are pilot activation items, not fundamental technical gaps."

### Extension 5: Admin — Platform Foundations (5 min)

**Route:** `/platform/admin` (ready)

- Show the users and access surface (read-only, roles and counts).
- Show the platform configuration surface.
- "This is the operator layer. Role-based access, tenant administration, agent configuration. In a pilot, your procurement operations team gets named roles. The programme manager sees their programme. The procurement lead sees the commercial events. The executive sees the tower. Access is scoped."

---

## What to Show in Programme Flagship

### Phase Rail (6 phases)

| Phase | Status |
|-------|--------|
| Discovery | Complete |
| Synthesis | In progress (current) |
| Design | Gate pending |
| Build | Not started |
| Validate | Not started |
| Operate | Not started |

- Current phase: Synthesis
- Gate: Design pending — 3 items remaining
- Journey progress: 3 of 6 phases

### Gate Status (3 items remaining)

| Item | Status | Unblocking Agent |
|------|--------|-----------------|
| Synthesis workshop attendees confirmed | Blocked | Steward |
| Evidence trace for value-hypothesis deliverable | Missing | Sentinel |
| Executive sponsor BAFO position | Not recorded | Atlas |

### Workshop 5: Decisions Reached

- Workshop held: 2026-04-18
- Decisions:
  1. CDP readiness sequenced first — AMS outcome is a commercial input, not a blocker to programme start.
  2. AMS vendor consolidation BAFO outcome feeds commercial evidence into programme gate.
  3. Value baseline evidence required before Design gate advances.
- Tension resolved: sequencing vs urgency — programme team chose to wait for BAFO rather than advance on assumption.
- Gate narrative: pending 3 remaining evidence items post-workshop.

### Deliverables Panel (14 deliverables, 6 phases)

| Phase | Count | Evidence Status |
|-------|-------|----------------|
| Discovery | 2–3 | Complete, evidence approved |
| Synthesis | 3–4 | In review, 2 items missing evidence |
| Design | 2–3 | Named, draft, evidence missing |
| Build | 1–2 | Named, draft, evidence missing |
| Validate | 1–2 | Named, not started |
| Operate | 1–2 | Named, not started |

- Total: 14 deliverables
- Evidence coverage: ~36%
- "The roadmap is real even when the evidence is not yet attached."

### Source Event Chip in Action Strip

- Chip label: "AMS Outsourcing — Vendor Consolidation 2026"
- Programme link: APX-CDP-2026
- Status: commercial event in progress
- Agent assigned: Nexus

### Agent Mission Signals

- 3 open agent missions on the programme
- Steward: attendee confirmation chase
- Sentinel: evidence trace consolidation
- Atlas: BAFO position recording prompt

---

## What to Show in Source Commercial Event

### Linked Programme Badge

- Badge text: APX-CDP-2026
- Label: CDP Activation Programme
- Purpose: "This commercial event informs the programme's gate evidence"

### 4 Vendors

| Generic Label | Demo Persona | Pricing Status |
|---------------|-------------|---------------|
| Vendor Alpha | Northstar | Complete |
| Vendor Beta | BluePeak | Partial |
| Vendor Gamma | Horizon | Partial |
| Vendor Delta | Meridian Systems | Missing |

*Note: Demo persona names are illustrative only. Seed data uses generic Vendor Alpha/Beta/Gamma/Delta labels.*

### Vendor Comparison Points

- **Completeness**: Vendor Alpha is the only complete submission. 3 of 4 vendors have gaps.
- **Pricing posture**: Cannot be normalised until Vendor Delta submits. Rate card gap is the primary blocker.
- **Assumptions**: Offshore ratio divergence means like-for-like comparison is not possible without Atlas normalisation.
- **BAFO opportunities**:
  - Vendor Alpha: volume commitment discount, SLA rebate structure
  - Vendor Beta: offshore ratio optimisation
  - Vendor Gamma: transition milestone payment deferral
  - Vendor Delta: no opportunities identified (incomplete submission)

### Commercial Risks Panel

| Risk ID | Label | Severity | Category |
|---------|-------|----------|----------|
| risk-001 | Incomplete rate card coverage | High | Pricing |
| risk-002 | Assumption divergence across vendors | Medium | Commercial |
| risk-003 | Transition cost opacity | High | Transition |
| risk-004 | SLA rebate structure absent for two vendors | Medium | Governance |
| risk-005 | Knowledge transfer cost unknown for Vendor Beta | Low | Evidence |

### BAFO Readiness Signals

| Signal ID | Type | Label | Severity |
|-----------|------|-------|----------|
| signal-001 | pricing_gap | Rate card gap — Vendor Delta | Critical |
| signal-002 | assumption_divergence | Offshore ratio divergence | Warning |
| signal-003 | bafo_readiness | BAFO scope partially confirmed | Warning |
| signal-004 | governance_gap | Rebate framework absent | Info |

### Agent Mission Queue

| Mission | Agent | Priority |
|---------|-------|----------|
| Request complete rate card from Vendor Delta | Nexus | High |
| Validate L3 support rate card from Vendor Beta | Sentinel | High |
| Normalise offshore cost assumptions across all vendors | Atlas | Medium |
| Confirm SLA rebate framework with Vendor Alpha and Gamma | Steward | Medium |
| Prepare executive decision brief pending Vendor Delta clarification | Nexus | Low |

---

## How Source Event Links to Programme

**The cross-surface dependency chain:**

```
AMS Vendor Consolidation Event
  └── BAFO outcome needed
        └── Provides commercial evidence for
              └── CDP Activation Programme gate (Design)
                    └── Evidence trace: value hypothesis deliverable
                          └── Executive sponsor BAFO position
                                └── Gate advances when evidence arrives
```

**Narrative thread:**

1. **AMS vendor consolidation** is the procurement event selecting the preferred AMS supplier for Apex Retail's 40+ application estate.
2. The **BAFO outcome** produces commercial evidence: normalised pricing, confirmed SLA structure, transition cost visibility.
3. That commercial evidence **informs the CDP programme's value hypothesis** — the programme depends on knowing the AMS steady-state cost to model the value of a customer data platform investment against it.
4. The **programme gate** to Design remains pending until the BAFO commercial evidence arrives and is traced to the value hypothesis deliverable.
5. This is the **cross-surface thread** that makes AbarVa a system vs a set of tabs: the programme knows about the sourcing event, the sourcing event knows it is a programme input, and the agents are working both sides.

---

## Workshop 5 Outcomes Narrative

**Workshop context:**
- Workshop 5: Synthesis session
- Held: 2026-04-18
- Purpose: consolidate Discovery findings, confirm Synthesis direction, surface gate requirements

**Three decisions reached:**

1. **CDP readiness first, AMS as commercial input.** The team agreed that CDP activation should proceed as the primary programme, with AMS outsourcing treated as a commercial input to the value model rather than a technical dependency.

2. **AMS as commercial input.** The BAFO outcome from the AMS vendor consolidation must be captured as evidence in the value hypothesis deliverable before the Design gate advances.

3. **Value baseline required.** The executive sponsor must record a BAFO commercial position — the baseline against which the CDP investment case is measured — before the gate item can be marked complete.

**Tension resolved: sequencing vs urgency.** The programme team debated whether to advance to Design immediately (urgency argument: the CDP technical architecture is not blocked by the AMS outcome) or wait for the BAFO evidence (sequencing argument: advancing the gate without the commercial baseline introduces value hypothesis risk). The team chose sequencing. The gate reflects that decision honestly.

**Gate narrative:** Pending 3 remaining evidence items as of 2026-04-26. "This is what a Nexus-led programme looks like 18 months in. The decisions are recorded. The gate is honest. The agents know what is blocking it."

---

## Deliverables Roadmap Narrative

**14 deliverables across 6 phases:**

- **Discovery (complete, evidence approved):** The discovery phase deliverables are done. Evidence is approved and traced. This phase is a clean baseline.
- **Synthesis (in-review, 2 items missing evidence):** The synthesis deliverables are produced and in review. The value hypothesis deliverable is missing its evidence trace. The synthesis narrative document is missing source citations.
- **Design through Operate (named, draft, evidence missing):** All remaining deliverables are named in the roadmap. They exist as draft artefacts. Evidence capture has not yet begun.
- **Evidence coverage: ~36%.** Honest. The programme is mid-stream. The roadmap is complete; the evidence is not.

**"The roadmap is real even when the evidence is not yet."**

This is a deliberate AbarVa design principle. The platform does not fabricate evidence coverage it does not have. Named deliverables with missing evidence are a signal to the programme team and the agents, not a gap to be papered over.

---

## Commercial Readiness Narrative

**BAFO readiness assessment:**

- 2 vendors incomplete (Vendor Beta: partial, Vendor Delta: missing)
- Vendor Delta rate card gap: critical signal — no normalised comparison is possible
- Pricing gap: the primary commercial blocker
- Assumption divergence: secondary blocker (resolvable by Atlas normalisation once Vendor Delta responds)

**AMS outcome as programme gate dependency:**

- The BAFO outcome from the AMS consolidation is the commercial evidence needed for the programme's value hypothesis deliverable.
- The executive sponsor BAFO position cannot be recorded until the normalised vendor comparison exists.
- The programme gate cannot advance until the sponsor records the position.
- "This is the commercial gate that programme delivery depends on."

**What resolves it:**
1. Vendor Delta submits complete rate card.
2. Atlas normalises offshore cost assumptions across all four vendors.
3. Nexus prepares the executive decision brief.
4. Executive sponsor reviews the brief and records their BAFO position.
5. Sentinel traces the evidence citation to the value hypothesis deliverable.
6. Gate item 2 (evidence trace) and gate item 3 (BAFO position) both resolve.
7. Gate advances to Design pending only the workshop attendee confirmation.

---

## What NOT to Claim

**Do NOT claim any of the following:**

- Do not claim real vendor responses or actual vendor pricing
- Do not claim approved or realised value savings
- Do not claim the programme gate has been passed or is imminent
- Do not claim live data ingestion from procurement systems
- Do not claim production deployment to the prospect's environment
- Do not claim the AI agents are running live computation during the demo
- Do not claim the vendor names (Northstar, BluePeak, Horizon, Meridian Systems) represent real vendor proposals
- Do not quote specific pricing figures as real market rates
- Do not claim savings amounts are guaranteed or based on live benchmarks

**All numeric values are deterministic demonstration seeds:**
- 14 deliverables: seed value
- 36% evidence coverage: seed value
- 3 gate items remaining: seed value
- 4 vendors: seed value
- 5 risks: seed value
- 4 signals: seed value
- 5 agent missions: seed value

These values are representative and useful for demonstrating the platform's analytical vocabulary. They are not live outputs.

---

## Pilot Ask

**The ask:**

"Sign Apex Retail as a pilot client.

What you see today is the demonstration layer. Pilot engagement connects live procurement data, enabling real BAFO evidence, real value hypothesis validation, and real programme gate progression.

The platform is ready for a pilot. The question is whether Apex Retail is ready to move from demonstration to discovery."

**What a pilot engagement activates:**

| Activation Item | Current State | Pilot State |
|-----------------|---------------|-------------|
| Live data ingestion | Deterministic seed data | Live procurement data connected |
| BAFO engine wiring | Demo scenario | Real vendor submissions tracked |
| Azure private data plane | Blueprint documented | Deployed within Apex Retail's Azure boundary |
| Programme owner access | Demo admin user | Named users with scoped roles |

**Pilot readiness caveats:**

The following items are currently at blueprint / contract level and require activation work during the pilot engagement:

1. **Live ingestion**: Connecting Apex Retail's procurement data sources (ERP, sourcing platform, document store) to the AbarVa evidence layer.
2. **BAFO engine**: Wiring real vendor submission documents to the commercial intelligence surface so signals reflect actual submissions.
3. **Azure private data plane**: Deploying the AbarVa stack within Apex Retail's Azure VNet under their security boundary. No procurement data leaves their environment.
4. **Procurement owner access**: Onboarding programme managers, procurement leads, and executive sponsors as named users with role-scoped views.

None of these are fundamental technical gaps. They are integration and configuration items that the pilot engagement resolves.

---

## Routes Reference

| Route | Status | Notes |
|-------|--------|-------|
| `/tenant/apex-retail/programs` | Ready | Programme portfolio index for Apex Retail |
| `/tenant/apex-retail/programs/[cdp-slug]` | Ready | CDP Activation programme flagship page |
| `/source/events/apex-retail-ams-outsourcing-2026` | Ready | AMS vendor consolidation event with commercial intelligence |
| `/platform/admin/architecture` | Ready | 9-plane architecture canvas |
| `/platform/admin/production-readiness` | Ready | Production readiness tracker (honest blockers visible) |
| `/intelligence` | Ready (thin) | Pattern detection surface — seeded, live ingestion deferred |
| `/control-tower` | Ready (thin) | Portfolio signal feed — seeded, live ingestion deferred |
| `/platform/admin` | Ready | Admin surface — users, access, configuration |
| `/source` | Ready | Source events list |

**Route status key:**
- **Ready**: Route renders, seed data loads, usable in demo.
- **Ready (thin)**: Route renders but surface depth is limited. Use with caveat framing.
- **Deferred**: Route does not exist or is not demo-ready.

---

## Demo Preparation Checklist

Before presenting, verify:

- [ ] `npm run dev` running locally (or deployed environment accessible)
- [ ] `npm run db:seed` confirmed — Apex Retail tenant seeded with 4 programmes
- [ ] `/tenant/apex-retail/programs` loads without error states
- [ ] CDP Activation programme detail page renders — phase rail visible
- [ ] Gate status panel renders — 3 items showing
- [ ] `/source/events/apex-retail-ams-outsourcing-2026` loads — vendor comparison visible
- [ ] Linked programme badge (APX-CDP-2026) visible on source event page
- [ ] Commercial risks panel renders — 5 risks visible
- [ ] BAFO signals panel renders — 4 signals visible
- [ ] Agent mission queue renders — 5 missions visible
- [ ] Signed in as `admin` demo user (OTP: `424242`)
- [ ] No red error banners, no "undefined" text, no blank panels

---

*Wave 19 · Lane H · DEMO7 · Deterministic seed data · 2026-04-26*
