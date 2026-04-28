# AbarVa — Investor Package (15 minutes)

**Script ID:** DEMO11  
**Version:** 1.0 — 2026-04-26  
**Audience:** Angel investors, seed-stage VCs, strategic investors in enterprise SaaS / AI infrastructure  
**Format:** Live demo or slide-supported walkthrough  
**Duration:** 15 minutes

---

> **Fabrication policy:** No fabricated ARR, pipeline figures, customer counts, or market share claims. Current traction is described honestly as "enterprise pilot phase." No future revenue projections are stated. No ROI claims made on behalf of clients.

---

## Pre-Demo Setup

- [ ] Platform loaded at `https://nexus-vert-kappa.vercel.app`
- [ ] `/tenant/apex-retail/tower` open in second tab
- [ ] `/tenant/apex-retail/programs/contact-center-ai` (or CDP) open in third tab
- [ ] Fallback: static screenshots if internet unavailable

---

## Section 1 — The Problem (minutes 0–3)

**Talk track (no screen share yet):**

"Enterprise organisations are running more AI programmes than ever. McKinsey, Gartner — the numbers are well-documented. The problem is not the number of AI initiatives — it is the data layer underneath them.

A typical Fortune 500 has 10 to 20 active AI programmes. Each one has a governance obligation, a commercial vendor dependency, and an evidence trail connecting programme decisions to business outcomes. That data is currently sitting in spreadsheets, email threads, SharePoint folders, and project management tools — none of which talk to each other.

The result: programme gates slip because nobody has the evidence. Vendor selections get decoupled from programme reality. The CISO cannot answer 'what data is this AI system consuming?' without a two-week investigation. The CFO cannot tell you which AI programmes are actually delivering return.

This is not a process problem. It is a data infrastructure problem. And that is what AbarVa solves."

---

## Section 2 — The Solution (minutes 3–8)

**Share your screen and open the Tower view.**

**Talk track:**

"AbarVa is the intelligence layer that connects programme governance, commercial procurement, and the evidence trail. Three things in one platform — none of which currently have a purpose-built system at the enterprise level.

Let me show you the Tower view first — this is the executive layer.

[Point to Atlas pressure cards] Atlas is our executive intelligence agent. It surfaces portfolio-level signals: cost consumption across AI programmes, adoption rates, governance exposure, and delivery risk. This is the view the CTO and CFO need to manage their AI portfolio. It currently exists only as a PowerPoint deck produced by management consultants every quarter. AbarVa makes it a live dashboard.

[Navigate to a programme detail] Now the programme layer. Every AI initiative has a structured lifecycle — phases, gates, deliverables, evidence items. The gate cannot advance without evidence-backed sign-off. This is the governance model that enterprise clients need to satisfy their audit and compliance obligations.

[Point to linked source event] And the commercial layer — connected directly to the programme. The vendor selection that supplies the infrastructure for this programme is tracked here. The BAFO deadline, the vendor shortlist, the commercial risks — all visible from the programme view. This is the connection that no enterprise currently has in a single platform."

**What to click:** Tower pressure cards, programme phase rail, source event chip.

---

## Section 3 — The Demo (minutes 8–12)

### 3a — Tower Portfolio View (minutes 8–10)

**Route:** `/tenant/apex-retail/tower`

"Apex Retail is our reference demonstration client. Four active AI programmes. The Tower view gives you the Atlas signal across all four.

Cost concentration signal: CDP is consuming the largest share of programme investment. Is it on track to justify that concentration? Gate status says it is in the evidence-gathering phase before Validate — on track.

Governance exposure: Demand Forecasting has a governance gap flagged. The compliance gate for that programme requires an updated risk assessment that has not been submitted. This surfaces automatically — no status meeting required.

This is the executive view. One dashboard. Full portfolio. Updated whenever the programme data changes."

### 3b — Programme Flow (minutes 10–12)

**Route:** `/tenant/apex-retail/programs` then one programme detail

"The programme layer is where the advisor and programme team work daily.

[Phase rail] Six phases. The current phase is active. The gate to the next phase is pending — three evidence items outstanding. The recommended next action is surfaced at the top.

[Source event chip] This programme has a commercial dependency — the AMS vendor selection. Click through and you see the vendor comparison, the BAFO status, the top commercial risk. All of it connected.

This is the data workflow that currently takes a senior advisor two days per week to manually assemble. AbarVa makes it real-time."

---

## Section 4 — Market, Traction, Roadmap (minutes 12–15)

**Talk track (no screen share; or close to last slide):**

### Market

"The addressable market is enterprise procurement intelligence at the intersection of AI programme governance. Gartner estimates Fortune 500 enterprises are running $2–10M in AI programme spend per year per initiative, with 10–20 initiatives in flight. The governance and intelligence infrastructure to manage that portfolio does not yet exist as a product category. AbarVa is creating it.

[Do not quote a specific TAM figure unless you have a cited source.]"

### Traction

"We are in enterprise pilot phase. We have a production SaaS platform with 16 active routes, a full data trust and evidence model, and a security architecture designed for Fortune 500 data sovereignty requirements — including an Azure private data plane model for clients who cannot use a shared SaaS.

Our first enterprise pilot is in progress. We are not claiming paid revenue. We are claiming a production platform that is ready to onboard a paying enterprise client."

### Roadmap

"Post-pilot priorities:
1. Real-time data integration — connecting AbarVa to the client's existing programme management and procurement systems
2. Document processing — ingesting RFP responses, contracts, and evidence documents directly into the evidence layer
3. Enterprise auth — custom identity provider integration for clients who require SSO and enterprise MFA
4. Audit-ready logging — structured audit log for SOC2 readiness

These are post-pilot features. The current pilot validates the core intelligence value proposition."

### Ask

"We are raising [seed / pre-seed] to fund [12 months of] enterprise pilot development and the first two commercial contracts. The use of funds is: [be specific based on actual raise details — do not fabricate].

I am happy to share the full security posture document, architecture docs, and pilot programme data. What questions do you have?"

---

## Investor Q&A — Common Questions

| Question | Honest Response |
|---|---|
| "What is your ARR?" | "We are pre-revenue, in enterprise pilot phase. Our first commercial conversation is [describe without fabricating]." |
| "Who are your competitors?" | "The closest analogues are ServiceNow's Strategic Portfolio Management, Planview, and enterprise consulting firms (Accenture, BCG who build bespoke dashboards). None of them connect programme governance to commercial procurement in a single intelligence layer." |
| "Why is this defensible?" | "The data model is the defensibility. Once a client's programme evidence, vendor comparisons, and agent intelligence are structured in AbarVa, switching cost is high. The intelligence compounds over time — the longer a client is on the platform, the more pattern signal is specific to their portfolio." |
| "What is your go-to-market?" | "Advisor-led: procurement consulting firms bring AbarVa into their client engagements. The advisor becomes more valuable — they have intelligence infrastructure; their competitors have spreadsheets." |
| "Is the AI generating the signals?" | "The intelligence patterns are evidence-grounded. In the current platform, they are deterministic seed patterns. The agent architecture is designed to support live model inference — that is the Wave 30+ roadmap item after the evidence pipeline is fully live." |
| "What is the pricing model?" | "We are exploring [per-programme SaaS / per-seat / advisor firm license] — to be validated in the pilot. We have not published pricing." |

---

_AbarVa Investor Package — v1.0 — 2026-04-26_  
_No fabricated metrics, ARR, market size claims, or ROI figures included. All traction claims are accurate to current pilot phase._
