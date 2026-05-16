# Scenario · Apex Retail — Contact Centre AI Routing

**Tenant:** Apex Retail Group (Target-class retail composite, ~$80B revenue)
**Decision archetype:** Workforce / contact-centre AI — human-in-loop assistant moving toward agentic routing
**North-Star loop covered:** Context → Intelligence → Move → Source → Tower → Outcome
**Status against seed:** This Move is already seeded (`scripts/seed-apex-demo-move.ts`) as *Contact Center AI Routing · P3 Design* — the script walks the loop a demo-er or QA tester can follow live.

> **How to use this script.** Each step names the surface to open, what the surface should show, the expert judgment the fronting agent applies, the artifact/decision produced, and the seed evidence it draws on. Surfaces: Intelligence (Sentinel) · Moves = `/programs` (Nexus) · Source (Sentinel) · Tower (Atlas). Sign in as the Apex CIO demo account (`cio@apex-retail`).

---

## Step 0 · Context Layer — what the tenant already knows

**Surface:** Setup / Data Trust view (Steward).
**Shows:** Apex intelligence-layer overlay loaded — 34 first-class KPIs, 7 full-schema pattern packs, 9 telemetry sources, vendor landscape. Relevant context segments:

- KPI cluster **2.3 Customer** — CSAT Omnichannel, NPS, Retention, owner Marcus Whitfield (EVP Chief Customer Officer).
- KPI cluster **2.7 Employee** — Store Engagement 68% vs 76% target, Store Retention 62%.
- Pattern **3.3 Shadow AI in Merchandising and Customer Operations** — 14 AI tools, $2.1M annualized spend, 9/14 below governance threshold, 3 with customer-facing inference.
- Pattern **3.6 Store Workforce Productivity and Engagement Gap**.
- Vendor landscape — Salesforce, AWS, Anthropic, OpenAI, AWS Bedrock, Genesys-class contact-centre tooling implied by Customer Care org.

**Expert judgment:** Steward confirms freshness and trust rung per segment; flags that org-structure context is recent enough for sponsor-chain confidence.
**Artifact:** Context readiness snapshot — green for KPI/vendor data, the grounding for everything downstream.

---

## Step 1 · Intelligence — identify and pressure-test the bet

**Surface:** Intelligence (`/intelligence`), Sentinel-fronted.
**Shows:** The pattern-to-Move funnel. Sentinel surfaces a candidate pattern: **contact-centre service cost and experience pressure** — drawn from the Customer KPI cluster (CSAT Omnichannel under target) crossed with **Pattern 3.3 Shadow AI** evidence (customer-facing AI tools running without model governance).
**Expert judgment (AI product leader + governance lead):** Sentinel pressure-tests the bet:

- *Is it the right bet?* Cost-to-serve and CSAT both move with call routing — yes, material.
- *What's the risk?* 3 of 14 shadow-AI tools already do customer-facing inference with no oversight — doing nothing is itself a control gap.
- *Readiness caveat:* Customer-data fragmentation (Pattern 3.4 CDP Consolidation) means transcript/intent data is not yet unified — a readiness gate, not a blocker.

**Artifact / decision:** A pressure-tested **bet brief** — "Govern and modernise contact-centre AI routing as one initiative" — promoted from the funnel into Moves.
**Evidence drawn on:** Pattern packs 3.3 and 3.6; Customer KPI segment 2.3; vendor landscape.

---

## Step 2 · Move — shape it into a governed initiative

**Surface:** Moves (`/programs`), Nexus-fronted. Open the **Contact Center AI Routing** Move — phase **P3 Design**.
**Shows:** Phase trace P0→P3 with completed gates, the deliverable set, the squad, and milestones.

- Squad (seeded): Carlos Rivera (CIO, executive sponsor), Lynne Stratham (CDO, data sponsor), Maya Reyes (VP Customer Care, sponsor-care), David Okafor (Program Lead), Erin Cho (Enterprise Architecture Director).
- Completed: P0 origination brief, P1 discovery report, P2 baseline metrics + root-cause analysis + Continue decision.
- In progress (P3): root-cause→design traceability matrix; architecture & routing options.
- Not started (P3): target operating model; **sourcing strategy decision**; P3 gate readiness.
- Milestones: P0/P1/P2 gates hit; **Architecture Council design review (2026-05-15)** and **Privacy review on transcript use (2026-05-17)** upcoming.

**Expert judgment (agentic solution architect):** Nexus classifies the solution archetype — **human-in-loop assistant first, not full agentic routing**. Reasoning: intent data is not unified (CDP gap), and customer-facing inference needs the privacy review cleared before autonomy increases. Nexus produces the workflow decomposition — call intake, intent classification, routing decision, agent assist, escalation/exception — and marks transcript use as a control requiring the 2026-05-17 privacy gate.
**Artifact / decision:** P3 solution design + traceability matrix; archetype call recorded; the **sourcing strategy decision** deliverable is opened, which triggers the handoff to Source.
**Evidence drawn on:** Pattern 3.3 governance evidence; Customer/Employee KPI baselines locked in P2.

---

## Step 3 · Source — choose the commercial / partner / vendor path

**Surface:** Source, Sentinel-fronted, entered via the Move's *sourcing strategy decision* deliverable.
**Shows:** A sourcing event seeded from the Move with the should-cost and delivery-model frame.
**Expert judgment (IT sourcing advisor):** Sentinel runs Stage 0–1 of the sourcing methodology:

- **Demand challenge:** This is not one SI RFP. Split into three lanes — (a) contact-centre platform / routing engine (likely a Salesforce/AWS-adjacent buy), (b) model operations & governance for customer-facing inference, (c) workflow redesign and change/adoption for Customer Care.
- **Buying motion:** Lane (a) buy or renew; lane (b) AI engineering partner or managed service; lane (c) internal + change partner.
- **Vendor risk:** Customer-facing inference + transcript data raises model-governance and data-handling risk; carry it as an explicit control into vendor selection. Anthropic / AWS Bedrock already in the vendor landscape — incumbent leverage exists.

**Artifact / decision:** A **sourcing strategy** — three-lane decomposition with buying motion, should-cost band, and commercial controls — written back to the Move's sourcing-strategy deliverable.
**Evidence drawn on:** Vendor landscape (Salesforce, AWS, Anthropic, Bedrock); Pattern 3.3 spend baseline ($2.1M shadow-AI spend = consolidation opportunity).

---

## Step 4 · Tower — track value, risk, adoption, outcomes

**Surface:** Tower, Atlas-fronted. Open the Apex portfolio; find **Contact Center AI Routing**.
**Shows:** The Move as a portfolio card with projected value, risk posture, adoption readiness, and dependency links to the Source event.
**Expert judgment (CFO portfolio operator + governance lead):** Atlas ranks the executive action:

- **Projected value** — cost-to-serve reduction + CSAT lift, tied to KPI cluster 2.3.
- **Risk / dependency** — the **Privacy review on transcript use (2026-05-17)** is the gating dependency; the CDP-consolidation data gap is a value-leakage risk if routing launches on fragmented intent data.
- **Executive action this week** — clear the privacy gate and confirm the three-lane sourcing strategy before the Architecture Council review; this is the action, not another status meeting.

**Artifact / decision:** Tower executive action entry + a board-ready line item for the Apex portfolio brief.
**Evidence drawn on:** Move milestones; Source event risk posture; Customer KPI baselines.

---

## Step 5 · Outcome — evidence feeds back to the Context Layer

**Surface:** Tower outcome ledger → Context Layer.
**Shows:** As the assistant pilots, Tower records projected → tracked → verified value: contact-centre cost-to-serve, CSAT Omnichannel movement, and the count of governed vs shadow customer-facing AI tools.
**Expert judgment:** Atlas distinguishes *projected* from *verified* — no value is claimed verified until the pilot telemetry confirms it; adoption by Customer Care agents is tracked alongside the financial metric.
**Artifact / decision:** Outcome evidence — updated CSAT and cost-to-serve readings, governance-coverage delta — written back as fresh context segments, retiring the original Pattern 3.3 "9/14 ungoverned" evidence.
**Loop closed:** The verified outcome and the archetype/sourcing learning feed the context layer and the pattern graph, improving the next contact-centre bet.

---

## Loop coverage checklist

| Step | Surface | Produced |
|---|---|---|
| Context | Setup / Data Trust (Steward) | Context readiness snapshot |
| Intelligence | Intelligence (Sentinel) | Pressure-tested bet brief |
| Move | Moves `/programs` (Nexus) | P3 solution design + archetype call |
| Source | Source (Sentinel) | Three-lane sourcing strategy |
| Tower | Tower (Atlas) | Executive action + portfolio line |
| Outcome | Tower outcome ledger → Context | Verified-value evidence, loop closed |

**Seed realism:** Strong. The Move, squad, deliverables, milestones, KPIs, pattern packs, and vendor landscape are all seeded — this scenario is grounded, not invented.
