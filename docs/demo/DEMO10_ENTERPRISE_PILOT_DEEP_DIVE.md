# AbarVa — Enterprise Pilot Deep Dive (45 minutes)

**Script ID:** DEMO10 (Wave 26)  
**Version:** 1.0 — 2026-04-26  
**Audience:** Enterprise pilot client — full leadership team (CTO, CISO, VP Procurement, VP IT, Executive Sponsor)  
**Format:** Live platform walkthrough with talk track  
**Pre-requisite:** Client has completed the onboarding guide and logged in at least once

---

> **Fabrication policy:** This script references only features and data that exist in the current platform. No ROI figures, market share claims, or savings percentages are stated. Confidence scores and intelligence patterns shown are deterministic seed data and are described as such.

---

## Pre-Demo Checklist (10 minutes before)

- [ ] Logged in as client's advisor account (or demo admin OTP 424242 for demo environment)
- [ ] `/home` loaded and visible
- [ ] `/tenant/apex-retail/programs` loaded in a second tab (or client's tenant if available)
- [ ] `/source/events/apex-retail-ams-outsourcing-2026` loaded in a third tab
- [ ] `/tenant/apex-retail/intelligence` loaded in a fourth tab
- [ ] `/tenant/apex-retail/tower` loaded in a fifth tab
- [ ] `/admin` accessible in a sixth tab
- [ ] Azure architecture diagram open in seventh tab (docs/architecture/azure/AZLAB7)
- [ ] Fallback: static screenshots in `/docs/demo/` if any live route fails
- [ ] Internet connection verified; screen-share tested

---

## Opening (minutes 0–5) — Platform Overview and AbarVa Positioning

**Before you share your screen, open with this framing:**

"Thank you for making time today. Over the next 45 minutes I am going to show you AbarVa working at full depth — programmes, commercial events, intelligence, and architecture. I will be honest about what is live now and what is on the roadmap. Feel free to stop me with questions at any point.

AbarVa addresses a specific problem that every organisation running multiple AI initiatives hits: the data connecting programme governance and commercial procurement is scattered across spreadsheets, email threads, and PowerPoint decks. Nobody has the full picture. Gates slip. Vendor decisions get decoupled from programme reality. And when the CISO asks 'what data is this AI system using?' — the answer takes weeks to find.

AbarVa is the operating system that connects these three layers: the programme of work, the commercial sourcing event, and the evidence trail. It is not a project management tool. It is not a procurement platform. It is the intelligence layer on top of both.

What you are about to see is the Apex Retail demonstration environment. It is representative — all data is authored seed data. I will call out the points where your real programme data would replace what you see here."

**Share your screen and open `/home`.**

---

## Section 1 — Home: Executive Command Center (minutes 0–5)

**Route:** `/home`

**Talk track:**

"This is the Home page — the executive entry point. Every active AI programme, recent alerts, and recommended actions in a single view.

The AI Activity Queue shows the top items requiring attention across the portfolio. For Apex Retail, you can see three programmes active this week. The queue surfaces the one action that would have the highest impact if completed today.

The programme cards give you phase status at a glance. Green means the current phase is on track. Amber means a gate is pending — evidence items are outstanding. Red means something is blocked.

In your pilot, this would show your organisation's programmes."

**Click:** Any programme card in the queue. Let the navigation demonstrate itself.

**What NOT to say:** Do not say "real-time" — the platform shows seed data. Do not quote any adoption percentage or ROI figure.

---

## Section 2 — Programs Surface: Portfolio and Flagship (minutes 5–15)

**Route:** `/tenant/apex-retail/programs` then `/tenant/apex-retail/programs/contact-center-ai`

### 2a — Portfolio View (minutes 5–8)

**Talk track:**

"The Programs surface shows all active AI programmes for the organisation. Apex Retail has four: Contact Center AI, the Customer Data Platform activation, Store Associate Productivity, and Demand Forecasting.

Each card shows the programme's phase, the gate status, and the top signal from this week. You can see that three programmes are in active delivery and one — Demand Forecasting — is in the Synthesis phase, which means it is at the evidence-gathering stage before the gate to Design.

The phase distribution across the portfolio matters. If every programme is in the same phase at the same time, you have a resource concentration risk. If no programme has reached Deploy in the last quarter, you have a delivery pace problem. AbarVa makes this visible."

**What to click:** Phase distribution area, any programme card.

### 2b — Programme Flagship: CDP Activation (minutes 8–12)

Navigate to the CDP programme detail page.

**Talk track:**

"Let me go deeper on the CDP programme, which is the most commercially significant for Apex Retail. This is a multi-phase transformation connecting data infrastructure, vendor sourcing, and AI model deployment.

The phase rail at the top shows six phases — Discovery is complete. Design is complete. Build is complete. Synthesis is the current active phase — this is the evidence consolidation and validation stage before the gate to Validate.

The gate status chip shows this gate is pending. Three evidence items remain: synthesis workshop attendance confirmation, evidence trace for the value hypothesis deliverable, and the executive sponsor BAFO position is not yet recorded.

This last item is directly connected to the commercial sourcing event. The BAFO from the AMS vendor selection is a required input to the programme gate. The gate cannot advance until the commercial decision is complete. Let me show you that connection."

**What to click:** Phase tab, gate status chip, recommended next action, source event chip.

**What NOT to claim:** Do not say the gate auto-advances — it requires human sign-off.

### 2c — Programme Detail: Deliverables and Risks (minutes 12–15)

**Talk track:**

"The Deliverables tab shows every evidence item required across all phases. You can see which are complete (green), which are outstanding (amber), and which are overdue (red). Each deliverable has an owner and a confidence score.

The Risks tab shows the current risk register. For the CDP programme, the top risk is BAFO timeline dependency — if the vendor selection slips past June, the CDP Q3 integration window is compressed. This risk is not in a separate risk spreadsheet somewhere — it is visible here, attached to the programme it affects.

This is what programme intelligence looks like when it is integrated with commercial data."

**What to click:** Deliverables tab, any deliverable card, Risks tab, top risk item.

---

## Section 3 — Source: Commercial Event Intelligence (minutes 15–25)

**Route:** `/source/events/apex-retail-ams-outsourcing-2026`

**Talk track:**

"Now let me show you the commercial side of this story. The AMS outsourcing event is the vendor selection that the CDP programme depends on. Click the source event chip on the programme, and we land here.

The linked programme badge at the top confirms that this event informs the APX-CDP-2026 programme. AbarVa knows this relationship — it is not implied, it is explicit.

The vendor comparison shows four vendors. Northstar Managed Services and ArcVault Managed have been invited to BAFO. BlueMaster Operations was excluded — the reason: transition plan quality gap. DataPeak Services was excluded — the reason: onboarding timeline risk to the CDP Q3 window.

This is important. The exclusion reasons are specific. They are linked to the programme dependency. This is not a generic procurement decision — it is a programme-informed commercial judgement.

The BAFO responses from Northstar and ArcVault are due 15 May. If that deadline slips, the programme gate slips. AbarVa surfaces this dependency so the advisor team can manage it actively."

**What to click:** Linked programme badge, vendor comparison cards, BAFO status, top risk.

**What to clarify if asked:** The vendor names are seed data — not real vendors. The structure of the event is representative of a real BAFO process.

### 3a — Commercial Risk Signals (minutes 22–25)

**Talk track:**

"Below the vendor comparison you can see the commercial risk signals for this event. BAFO deadline pressure, pricing normalization across four vendor responses, and the onboarding timeline risk.

AbarVa does not just display this data — it structures it. Every risk has a severity, an owner, and a connection to the programme timeline it affects. When your advisory team reviews this, they know exactly what to act on."

---

## Section 4 — Intelligence + Tower (minutes 25–35)

### 4a — Intelligence: Sentinel Pattern Library (minutes 25–30)

**Route:** `/tenant/apex-retail/intelligence`

**Talk track:**

"Sentinel is AbarVa's intelligence agent. The Intelligence surface shows market and competitive patterns relevant to your organisation's portfolio. These are not generic AI-generated insights — each pattern has an evidence basis and a confidence score.

The patterns shown here are drawn from the Apex Retail portfolio context. A pattern flagged as high confidence means Sentinel has triangulated it across multiple evidence sources. A pattern flagged as medium confidence means it is directionally correct but evidence is incomplete.

Recommended actions are attached to each pattern. These are concrete steps — not generic guidance. The advisor team uses these to inform client conversations with an evidence base.

I will be explicit: these are deterministic seed patterns in this environment. In a live deployment with your actual procurement and programme data, Sentinel would surface patterns specific to your portfolio and market context."

**What to click:** Any pattern card, evidence section, recommended action.

**What NOT to say:** Do not claim real-time model output. Do not claim Sentinel is running a live model.

### 4b — Tower: Atlas Executive Brief (minutes 30–35)

**Route:** `/tenant/apex-retail/tower`

**Talk track:**

"Atlas is the executive view. The Tower surface shows portfolio-level health signals: cost and consumption across AI programmes, adoption rate signals, risk exposure, and governance status.

This is the view your CFO and CISO need. Cost: where is AI spend concentrated, and is it producing outcomes? Adoption: which programmes have user adoption above threshold, and which are at risk of being shelf-ware? Governance: are your AI programmes meeting the compliance gates required by your risk framework?

The pressure cards surface the signals that need executive attention this week. In Apex Retail, Atlas is flagging cost concentration in the CDP programme and a governance gap in the Demand Forecasting programme.

Again, these are seed signals — in your live environment, Atlas would reflect your actual portfolio data."

**What to click:** Signal cards, pressure cards, any tab.

---

## Section 5 — Admin Surface: Data Trust and Production Readiness (minutes 35–40)

**Route:** `/admin`

**Talk track:**

"Let me show you the Admin surface — this is typically the advisor or platform administrator view, not the executive view. I am showing it because it is relevant to your security review.

The Production Readiness Tracker shows the current status of every platform component — auth, data layer, API routes, CI/CD. This is how AbarVa monitors its own operational health.

The Data Trust section shows the trust level assigned to each evidence source. Agent-usable data is data that the intelligence agents can consume to generate patterns and recommendations. Raw-record data is accessible to users but not used in agent reasoning. This distinction is enforced at the API layer — not just a UI label.

This matters for your CISO. Every piece of data in the platform has a trust classification, and that classification is enforced programmatically."

**What to click:** Production readiness tracker, data trust indicators.

---

## Section 6 — Azure Private Data Plane Architecture (minutes 40–45)

**Route:** Open the Azure architecture diagram in the second browser tab (AZLAB7 design doc or architecture diagram)

**Talk track:**

"The most common objection we hear from Fortune 500 IT teams is: 'We cannot send our data to a SaaS platform.' I want to address this directly.

AbarVa is designed to support a private data plane deployment for clients with data sovereignty requirements. In this architecture:

Your data stays entirely in your Azure subscription. You control the resource group, the identity model, and the encryption keys. AbarVa's SaaS layer — which runs on Vercel + Neon — never receives your raw data.

What crosses the boundary is a structured metadata manifest. AbarVa asks: 'What evidence exists in your data plane relevant to this programme gate?' Your private data plane responds with citation locators — file references, record IDs, metadata — not content.

The boundary policy is enforced in a Container App running in your Azure subscription. It strips any raw-data field before allowing any response to leave. AbarVa's agents reason over the manifest, not the source data.

For your CISO: this means you retain custody of your data at all times. AbarVa has no standing access to your Azure environment — access is zero-standing, request-based, and logged in your Log Analytics workspace."

**What to click:** Architecture diagram components — customer subscription boundary, container app, blob storage, control plane.

**What to clarify if asked:** The Azure private data plane is designed and ready for provisioning; it is not yet in production for any client. Provisioning requires a client Azure subscription engagement.

---

## Close (minutes 43–45)

**Talk track:**

"To summarise what you have seen today:

AbarVa connects your programme of work to your commercial sourcing decision, grounds both in an evidence trail, and surfaces intelligence signals that your advisory team can act on. The governance layer means your executives know the programme status without attending a status meeting. The security architecture means your data stays where your risk framework requires it.

What we showed today is the current production platform — warts and all. We have not claimed features we have not built. The no-fabrication principle is core to how AbarVa works.

Next steps: [your advisor will walk you through the pilot data seeding process] / [your advisor will confirm the Azure data plane option for your environment] / [your advisor will schedule a follow-up in two weeks to review your pilot data].

Questions?"

---

## Handling Common Objections

| Objection | Response |
|---|---|
| "This is impressive but we need real-time data." | "Real-time integration is on our post-pilot roadmap. The current pilot uses your provided programme data. We can discuss the integration architecture on the technical call." |
| "Is the AI making decisions or just surfacing data?" | "AbarVa's agents surface evidence-grounded signals and recommended actions. No automated decisions are made without human approval. The gate model requires explicit human sign-off." |
| "What happens to our data if we stop the pilot?" | "Your data is deleted from the Neon database within 30 days of pilot end. We can provide a data export before deletion. In the Azure private data plane model, you have custody at all times." |
| "Who else uses this?" | "We are in enterprise pilot phase. I can discuss our pilot client profile with you under NDA." |
| "Can we see it with our own data?" | "Yes — that is the goal of the pilot. Your advisor will walk you through the data seeding process. Most clients are up with pilot data within 3 business days." |

---

_AbarVa Enterprise Pilot Deep Dive — v1.0 — 2026-04-26_  
_No fabricated metrics, market sizes, or ROI claims. All data described as seed data where applicable._
