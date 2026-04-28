# Source Commercial Intelligence — Demo Script

Nexus Procurement Platform | Wave 16 | 2026-04-26

---

## Before You Start

### Prerequisites

- Nexus running locally (`npm run dev`) or pointed at a deployed environment
- Demo seed loaded (`npm run db:seed` — confirms Apex Retail tenant with 4 programs and Meridian tenant with Intelligence demo data)
- A Source event open: navigate to `/source` and open the "AMS Consolidation — Q3" event (or any seeded event with commercial intelligence attached)
- Signed in as the `admin` demo user (OTP: `424242`)

### What to Verify Before the Demo

1. Route `/source` loads without error states — event list renders
2. Route `/source/events/[eventId]` renders the event canvas — journey tracker visible
3. Commercial Intelligence section expands — `SourceCommercialHub` 7-tab navigation visible
4. Executive Brief renders — dark navy header, posture badge visible
5. Action Queue renders — at least 5 actions visible
6. `/platform/admin/architecture` renders — 6 system layers visible
7. No red error banners, no "undefined" text, no blank panels

### What NOT to Claim

- **Do not claim** the system is connected to live vendor portals or external data feeds
- **Do not claim** the AI is generating analysis in real time during this demo
- **Do not quote** specific pricing figures as real market rates
- **Do not claim** savings amounts are guaranteed or based on live benchmarks
- **Do not say** Nexus, Sentinel, Atlas, or Steward agents are running live computation during the session

The demo runs on a deterministic seed. Every number, posture, and recommendation you see was authored as representative fiction — useful for demonstrating the platform's analytical vocabulary, but not a live output.

---

## Demo Route

| Step | URL | What You See |
|---|---|---|
| 1 | `/source` | Source events list — all seeded sourcing events |
| 2 | `/source/events/[eventId]` | Event canvas — journey tracker, timeline, commercial intelligence section |
| 3 | Expand "Commercial Intelligence" | `SourceCommercialHub` — 7-tab container |
| 4 | Hub → "Executive Brief" | Posture badge, dark navy header, top-3 risks, BAFO levers |
| 5 | Hub → "Action Queue" | 8 prioritised actions, show-more toggle |
| 6 | `/platform/admin/architecture` | 6 system layers, wave history, build stats |

### Wave-16 Commercial Sections

| Component | Purpose |
|---|---|
| `SourceCommercialHub` | Top-level 7-tab hub container for all commercial intelligence panels |
| `CommercialSummaryPanel` | Aggregated commercial summary with vendor scores and posture |
| `PricingComparisonPanel` | Vendor pricing normalised to comparable unit basis |
| `BAFONegotiationPanel` | Best-and-final-offer levers and recommended negotiation asks |
| `CommercialRiskPanel` | Risk flags with severity, category, and recommended mitigations |
| `CommercialReadinessView` | 6-check readiness checklist with completeness progress bar |
| `CommercialSignalsPreview` | Control-tower signals and intelligence patterns preview |
| Executive Brief | Posture badge, risk summary, and BAFO levers in a single-page executive view |
| Action Queue | 8 prioritised next actions with agent owner, urgency, and status |

---

## 10-Minute Version — "The Commercial Posture"

**Audience:** First meeting with a VP Procurement, CPO, or Sourcing Director. Time is limited. The goal is to show you have a point of view on commercial intelligence — not to demo every feature.

**Goal:** Leave the prospect thinking: "They understand what makes a sourcing event commercially sound. I want to see more."

### Talk Track

**Step 1 — Open the Source event canvas (30 seconds)**

Navigate to `/source`, select the AMS Consolidation event.

> "This is Nexus's Source module. When a sourcing event is running — an RFP, a re-bid, a managed services negotiation — this is where your team lives. The event canvas gives you the full picture: where you are in the process, what your vendors have submitted, and what decisions are still open."

**Step 2 — Expand the Commercial Intelligence section (30 seconds)**

Scroll to and expand the "Commercial Intelligence" section.

> "Nexus has assembled a commercial intelligence view for this event. Every time a new submission comes in, every time the scope changes, the platform updates its read of the commercial situation. This is not a static report — it's a live view of the commercial posture."

*(Pause. Let the hub render. Do not rush past it.)*

**Step 3 — Tab through Summary and Risks (2 minutes)**

Click the "Summary" tab, then "Commercial Risks."

> "The summary tells you at a glance: who's competitive, who's not, and where the gaps are. The risk panel is more interesting — it tells you what could go wrong before you make an award. This event has [N] risk flags. The top one is [read from screen]. That is the kind of thing that used to surface in a post-award review. Nexus surfaces it before."

**Step 4 — Show the Readiness checklist (1 minute)**

Click the "Readiness" tab.

> "Before any procurement team should make an award decision, there are things that need to be true. Pricing is normalised. Risk flags have been reviewed. Negotiation leverage has been identified. This checklist tells you exactly what is missing. Right now we are at [X of 6] checks complete. The missing ones are [read from screen]. This turns 'are we ready?' from a conversation into a dashboard."

**Step 5 — Executive Brief (3 minutes)**

Click the "Executive Brief" button or tab.

> "This is the executive brief. The posture badge at the top — [read: Conditional / Competitive / At-Risk] — is a single-word summary of where this event stands. Below it: the top three risks your team needs to address before you make an award. And here: the BAFO levers — the specific asks you should make in a best-and-final-offer round to improve the commercial outcome. This brief is designed to go directly to the CPO. One page. No ambiguity."

**Step 6 — Pilot ask (2 minutes)**

Close the brief. Return to the event canvas.

> "This is what Nexus does for every sourcing event. Commercial intelligence assembled from submission data, market context, and your own sourcing history — structured so that the team always knows where they stand commercially. We'd like to run this alongside your next AMS consolidation. Give us one event. We'll show you what it looks like when you have this on a real RFP."

### What NOT to Say in the 10-Minute Version

- Do not say the AI is running live
- Do not quote specific pricing numbers as real market benchmarks
- Do not claim the savings estimate is based on live data
- Do not promise features that are not visible in the current demo
- Do not explain the architecture — save that for the 45-minute version

---

## 20-Minute Version — "The Full Commercial Story"

**Audience:** Champion meeting, evaluation committee, or a CPO/CFO who has asked for a structured demo. You have enough time to walk all five stations.

**Goal:** Leave the prospect thinking: "This is a complete commercial intelligence capability. We want to pilot this."

### Talk Track — 5 Stations

**Station 1 — Source event context (2 minutes)**

Navigate to `/source`, select the AMS Consolidation event.

> "Let me start with the context. This is a sourcing event for Application Management Services — a common category with multiple vendors, complex scope, and significant multi-year commitment risk. The event canvas shows you the current state of the process: where we are in the journey, which vendors have submitted, and what the commercial situation looks like."

Point to the journey tracker.

> "The journey tracker shows you every stage of the process. Nexus's job is to give your team commercial intelligence at every stage — not just at award."

**Station 2 — Commercial Hub tour (4 minutes)**

Expand "Commercial Intelligence." Walk all 7 tabs briefly.

> "The Commercial Hub is the heart of the Source module's intelligence layer. Seven views, all derived from the same underlying data. Let me walk you through each one quickly."

Tab: Summary
> "The summary gives you a commercial-at-a-glance view. Vendor scores, posture, and the key tension in this event."

Tab: Pricing Comparison
> "Pricing comparison takes each vendor's submission and normalises it to a comparable unit basis. We'll come back to this — the normalisation story is important."

Tab: BAFO / Negotiation
> "BAFO — best-and-final-offer — is where you recover commercial value before award. This panel identifies the specific levers your team should pull."

Tab: Commercial Risks
> "Risk flags. Every sourcing event has them. Most teams discover them after award. Nexus surfaces them before."

Tab: Readiness
> "Readiness checklist. Six checks. Is the commercial picture complete enough to support an award decision?"

Tab: Missions
> "Agent missions. What Nexus, Sentinel, Atlas, and Steward are working on for this event — and what's still open."

Tab: Signals
> "Control-tower signals. What the platform's monitoring layer is seeing across this event — patterns, anomalies, and flags."

**Station 3 — Pricing Comparison deep-dive (4 minutes)**

Stay on the Pricing Comparison tab.

> "Pricing normalisation is one of the hardest problems in sourcing. Vendor A prices by seat-year. Vendor B prices by FTE per month. Vendor C prices by service tower with embedded headcount. You can't compare them. Nexus does the normalisation work — it converts every submission to a common unit basis so that like is compared to like."

Point to the completeness indicator.

> "The completeness indicator tells you where the normalisation has gaps. If a vendor's submission is missing a cost component, the platform flags it rather than silently extrapolating. That matters when you are preparing a BAFO ask — you need to know which vendors gave you an incomplete picture."

**Station 4 — BAFO and Negotiation (4 minutes)**

Click the BAFO / Negotiation tab.

> "BAFO strategy is where procurement teams recover commercial value. Most teams approach BAFO with a general ask — 'sharpen your pencil.' Nexus gives your team specific levers: which vendors have submitted above market for which components, where there is a pricing gap between competing submissions, and what a targeted BAFO ask looks like."

Point to the recommended asks.

> "These are the negotiation asks Nexus recommends for this event. Each one is tied to a specific evidence point from the submissions. This is not a generic checklist — it is an event-specific negotiation plan."

**Station 5 — Action Queue and Decisions (4 minutes)**

Navigate to the Action Queue section.

> "Before I close, let me show you the Action Queue. After all of this analysis, the question is: what does the team actually do next? The Action Queue answers that. Eight prioritised actions. Each one has an owner — a specific agent or human role — and a status."

Point to the agent roles.

> "Nexus orchestrates. Sentinel validates the evidence. Atlas focuses on negotiation leverage. Steward governs the compliance and audit trail. The Action Queue shows you the handoffs between agents and between agents and humans. This is what a structured procurement workflow looks like in an AI-augmented context."

**Close and pilot ask (2 minutes)**

> "What you have seen is the commercial intelligence layer for a single sourcing event. This runs on every event in the platform. The same analysis — pricing normalisation, risk detection, BAFO strategy, readiness assessment — available to your team for every managed services and technology procurement you run. We'd like to pilot this with you. One event. Your own team. Your own RFP. We configure the seed to your category and walk you through a full commercial review."

---

## 45-Minute Deep Dive — "Architecture + Story"

**Audience:** Technical champion, enterprise architecture lead, or a CPO who wants to understand how the platform works before sponsoring a pilot.

**Goal:** Leave the prospect thinking: "This is a real platform with a real architecture. The seed-first approach is honest and de-risks the pilot."

### Structure

| Time | Content |
|---|---|
| 0–20 min | 20-minute version above (all 5 stations) |
| 20–30 min | Architecture overview — 6 system layers, wave history |
| 30–40 min | Demo scenario seed walkthrough — deterministic seed explanation |
| 40–45 min | Pilot ask + integration roadmap |

### Minutes 20–30: Architecture Overview

Navigate to `/platform/admin/architecture`.

> "Let me show you how this is built. The architecture page gives you the full stack in one view. Six system layers."

Walk the 6 layers:

> "At the base: the data plane. Structured sourcing data, vendor submissions, pricing models, and evidence. Above that: the agent layer — Nexus for orchestration, Sentinel for evidence validation, Atlas for cost-value analysis, Steward for governance. The intelligence layer synthesises agent outputs into commercial views. The surface layer is what your team sees — the Source module, the Control Tower, the Programs workspace. Above that: the production readiness and build-operations layers that govern how the platform is built and deployed."

Point to the wave history.

> "The build history shows how the platform has evolved wave by wave. Wave 14 was the commercial intelligence models — pricing normalisation, risk detection, BAFO strategy, vendor comparison. Wave 15 was the UI surfaces — the hub, the panels, the readiness view. Wave 16 is what you are seeing today — the route mount, the demo scenario, the executive brief, and the action queue."

### Minutes 30–40: Demo Scenario Seed Walkthrough

Return to the Source event canvas.

> "Every number you have seen in this demo comes from a deterministic seed. Let me explain what that means and why it matters."

> "A deterministic seed is a fixed, authored dataset. It does not change between runs. It does not call external APIs. It does not require a live vendor portal connection. When you open this demo tomorrow, every price, every risk flag, every posture badge will be identical to what you saw today. That is intentional."

> "Why does that matter to you? Because it means we can walk through a full commercial review — pricing normalisation, risk detection, BAFO strategy — without touching your data, without connecting to your vendor systems, and without any risk of a live data failure during a critical meeting. The seed is representative fiction: every number is plausible for an AMS consolidation event, but no number is real."

> "When we move to a pilot, we replace the seed with your data. Your vendors. Your submissions. Your pricing. The platform's analytical logic is the same — it is the data that changes. The seed is a proof of concept. The pilot is where we prove it on your problem."

### Minutes 40–45: Pilot Ask and Integration Roadmap

> "The integration roadmap has three phases. Phase one is what you have seen today: deterministic seed, full commercial intelligence logic, representative demo scenario. Phase two is live ingestion — we connect to your e-sourcing platform or document repository, parse vendor submissions, and populate the commercial intelligence views from your real RFP data. Phase three is real-time signals — the control tower monitoring layer ingests live submission events, flags anomalies in real time, and Atlas surfaces negotiation opportunities as they emerge."

> "We are asking you to start at phase one. One sourcing event. Your team. Two weeks. At the end of phase one, you will know whether the commercial intelligence views give your team something they did not have before. If yes, we move to phase two together."

---

## What to Show

| Feature | Where | What to Point Out |
|---|---|---|
| SourceCommercialHub 7-tab navigation | `/source/events/[eventId]` → Commercial Intelligence | All 7 tabs visible; each tab loads instantly |
| Executive Brief | Hub → Executive Brief button | Posture badge (dark badge), dark navy header, top-3 risks, BAFO levers |
| Readiness checklist | Hub → Readiness tab | 6 checks, progress bar, missing-check indicators |
| Action Queue | Hub → Action Queue section or standalone | 8 actions, show-more toggle, agent owner chips |
| Signals & Patterns preview | Hub → Signals tab | Top-3 control-tower signals, top-3 intelligence patterns, severity chips |
| Admin architecture page | `/platform/admin/architecture` | 6 system layers, wave history, build stats |

---

## What NOT to Claim

- **Do not say** the system is connected to live vendor portals
- **Do not say** the AI is generating analysis in real time
- **Do not quote** pricing figures as real market rates
- **Do not say** Nexus, Sentinel, Atlas, or Steward are running live during the demo
- **Do not promise** features not yet built (live ingestion, real-time signal monitoring, live agent loops)
- **Do not claim** the savings levers represent guaranteed commercial outcomes
- **Do not say** the readiness checklist reflects a real RFP's completeness
- **Do not say** the risk flags were detected by a running AI model

The correct framing for every data point: "In the demo scenario, Nexus has assessed this as [X]. In a live pilot, that assessment would come from your actual submission data."

---

## Commercial Intelligence Story

### What Commercial Intelligence Means for Procurement

Commercial intelligence is the practice of assembling, normalising, and interpreting the financial and contractual signals in a sourcing event to support better award decisions. In most procurement teams, commercial intelligence is produced manually — analysts download vendor submissions, build comparison spreadsheets, and write executive summaries. The process takes days. It is inconsistent across team members. And it happens too late: most commercial analysis is completed after the evaluation is effectively over, when there is little leverage left.

Nexus's commercial intelligence layer changes the timing. Analysis is available as soon as submissions arrive. The platform assembles the commercial picture continuously — pricing normalisation, risk detection, BAFO strategy — and surfaces it through a structured set of views that your team can act on at every stage of the process.

### Why Pricing Normalisation Matters

Procurement teams consistently underestimate how much commercial value is lost in the comparison phase. When vendors price in different units — per seat, per FTE, per tower, per service credit — a direct comparison is impossible. Teams either pick a common denominator that advantages one vendor, or they accept that the comparison is imprecise and make an intuition-based decision. Neither outcome is acceptable when the contract value is eight figures.

Nexus normalises pricing at submission time. The platform reads each vendor's pricing model, identifies the unit basis, and converts every submission to a common comparable. The completeness indicator flags any vendor whose submission is missing a cost component. The result is a pricing comparison that your team can defend — to internal stakeholders, to auditors, and to the vendors themselves in a BAFO negotiation.

### What BAFO Strategy Adds

Best-and-final-offer rounds are the last significant opportunity to improve the commercial outcome before award. Most procurement teams approach BAFO with a general request: sharpen your pricing, improve your SLAs, reduce your escalation rates. The ask is vague. The vendor response is incremental. The opportunity is wasted.

Nexus's BAFO layer identifies specific levers — components where a vendor is priced above market, components where a competing submission creates credible pressure, contractual terms where there is room for improvement. The recommended asks are specific, evidence-backed, and prioritised by expected commercial impact. This turns a BAFO round from a ritual into a structured negotiation.

### How Risk Detection Changes the Conversation

Commercial risk in a sourcing event is usually discovered after award, when it is expensive to address. The vendor's pricing assumptions were more aggressive than stated. A scope exclusion creates a change-order exposure. A commercial term creates a liability that was not flagged during evaluation. Post-award commercial surprises are one of the primary drivers of managed services contract failures.

Nexus surfaces commercial risks before award. The risk detection layer flags pricing assumptions that appear optimistic, scope gaps that create change-order exposure, and contractual terms that carry commercial or compliance risk. Each flag includes a severity level, a category, and a recommended mitigation. Your team can address these risks in the BAFO round, in contract negotiation, or by requesting clarification from the vendor — rather than discovering them after the contract is signed.

### The Agent Collaboration Story

Nexus's commercial intelligence layer is not a single algorithm. It is the output of four agents working in collaboration. Nexus, the orchestration agent, directs the analysis — determining what needs to be assessed, in what order, and with what priority. Sentinel, the evidence and intelligence agent, validates the submission data and flags gaps or anomalies. Atlas, the cost-value agent, performs the financial analysis — pricing normalisation, BAFO lever identification, value outcome modelling. Steward, the governance agent, maintains the audit trail and ensures that every commercial decision is documented and defensible.

The Action Queue reflects this collaboration. Each action in the queue has an owner — a specific agent or a human role — and a status. The queue shows your team where the analysis is complete and where human judgment is still required. This is what AI-augmented procurement looks like in practice: agents doing the analytical heavy lifting, humans making the decisions.

### From Deterministic Seed to Live Data

The demo you are seeing runs on a deterministic seed — a fixed, authored dataset that represents a plausible AMS consolidation sourcing event. Every number is representative fiction: designed to illustrate the platform's analytical vocabulary without the risk of live data failure or sensitive data exposure.

The path from seed to production has three phases. In the first phase, we prove the commercial intelligence logic on a representative scenario — exactly what you have seen today. In the second phase, we connect to your data — your vendor submissions, your pricing models, your RFP documents — and run the same analysis on your actual sourcing event. In the third phase, we wire the control-tower monitoring layer to live submission events, enabling real-time commercial intelligence as the sourcing event unfolds. The seed is not a limitation. It is the first step on a clearly defined path.

---

## BAFO Story

**Talk track for explaining BAFO in a demo context**

Best-and-final-offer is the last structured opportunity to improve the commercial outcome before your team makes an award recommendation. Most organisations treat it as a formality — a final price check before the decision that has already been made. Nexus treats it as a negotiation event with specific leverage points.

The BAFO panel in Nexus identifies three types of leverage. First, competitive gaps: where Vendor A is priced meaningfully higher than Vendor B on comparable components, giving you a credible basis for a price improvement request. Second, market alignment: where a vendor's pricing for a specific component appears to be above the range typical for this category and scope. Third, commercial term improvements: where a non-pricing element — an escalation cap, a volume discount trigger, a SLA penalty structure — can be tightened to reduce long-term commercial exposure.

In the demo scenario, the BAFO panel for the AMS Consolidation event has identified [N] levers. The highest-priority ask is [read from screen]. That ask, if accepted, would change the commercial posture of this event from [current posture] to [improved posture]. That is what a structured BAFO round looks like when it is supported by platform intelligence rather than analyst intuition.

---

## Pricing Normalisation Story

**Talk track for explaining why pricing normalisation is hard and what Nexus does**

Vendor pricing for managed services is structurally incomparable. Vendor A bundles infrastructure, support, and professional services into a single per-seat rate. Vendor B separates each service tower and prices by FTE. Vendor C uses a consumption model with a committed minimum and overage rates. These are not variations on the same model — they are fundamentally different pricing architectures that reflect different assumptions about scope, risk, and volume.

Most procurement teams resolve this by asking vendors to resubmit in a common format. The problem is that vendors price strategically — the format that is most favourable to them is rarely the format that makes comparison easiest for you. When you force a common format, you often get a restatement that does not reflect how the vendor actually intends to deliver the service. You have normalised the spreadsheet but not the economics.

Nexus takes a different approach. Rather than asking vendors to change their pricing model, the platform reads each vendor's submission in its native format and constructs a normalised comparison internally. The normalisation logic accounts for the most common structural differences — bundling, unbundling, consumption versus committed, FTE versus seat versus tower pricing. The completeness indicator tells you where the normalisation has gaps — where a vendor's submission is missing a component that would be needed for a fair comparison. That transparency is the key: you see not just the normalised numbers, but the confidence level behind each number and the gaps that still need to be addressed.

---

## Risk Story

**Talk track for the commercial risk detection story**

The commercial risks in a sourcing event are not random. They follow patterns. Vendors with aggressive pricing assumptions tend to propose commercial terms that shift risk to the buyer. Scope descriptions with ambiguous boundaries create change-order exposure. Payment structures with front-loaded fees and back-loaded deliverables create cash flow risk. These patterns are recognisable — but only if your team has seen enough sourcing events to recognise them.

Nexus's risk detection layer encodes those patterns. For each sourcing event, the platform evaluates the vendor submissions against a library of commercial risk indicators — pricing aggressiveness, scope ambiguity, term structure, escalation exposure, and penalty adequacy. Each risk flag includes a severity level, a risk category, and a recommended mitigation action. The recommended mitigations are specific: not "review pricing assumptions" but "request a cost-basis justification for the Year 3 escalation rate, which is 2.5x the rate in the comparable Vendor B submission."

The value of pre-award risk detection is not just about avoiding bad outcomes. It is about changing the dynamic of the BAFO and contract negotiation rounds. When your team enters the BAFO round knowing that Vendor A has an aggressive escalation assumption and Vendor B has a scope ambiguity in the infrastructure tower, the negotiation is specific and evidence-backed. You are not negotiating against a spreadsheet — you are negotiating against a structured risk analysis that the vendor cannot easily dismiss.

---

## Control Tower / Intelligence Signal Story

**Talk track for the signals and patterns section**

The Signals and Patterns section in the Commercial Hub is a preview of the platform's monitoring layer. Control-tower signals are real-time observations about the sourcing event — a vendor submission that deviates from the expected range, a timeline risk that has emerged, a commercial pattern that warrants attention. Intelligence patterns are higher-level observations that cross multiple events — a vendor that is consistently aggressive in its initial pricing but recovers in BAFO, a category that systematically produces scope ambiguity risk, a market pattern that suggests pricing pressure is increasing.

In the demo scenario, the signals preview shows the top three control-tower signals for this event. These are not alerts in the traditional sense — they are observations that the platform has assembled and prioritised for your team's attention. The severity chips indicate which signals require immediate action and which are informational.

The patterns section is a preview of what becomes available once a team has run multiple events through the platform. With a single event, you can see the commercial posture for that event. With five events in the same category, you can see vendor behaviour patterns. With twenty events across categories, you can see market-level intelligence — which vendors are expanding their managed services footprint, which are pricing aggressively to win share, which categories are experiencing cost pressure. That is the long-term commercial intelligence story for Nexus: not just a better way to run a single sourcing event, but a platform that gets smarter with every event your team runs through it.

---

## Pilot Ask

### 5-Minute Version (2–3 sentences)

> "We would like to run Nexus alongside your next AMS consolidation or technology managed services re-bid. One event, your team, your RFP — we configure the scenario to your category and walk you through a full commercial review. Can we set up a 30-minute call this week to scope what that would look like?"

### 10-Minute Version (full paragraph)

> "What you have seen today is the commercial intelligence layer for a single sourcing event — pricing normalisation, risk detection, BAFO strategy, readiness assessment, and agent-orchestrated action queue — running on a representative demo scenario. The platform's analytical logic is complete. What we are asking for is the opportunity to prove it on your problem. We want to take one sourcing event from your current pipeline — ideally a managed services re-bid or technology consolidation where the commercial complexity is high — configure the platform with your category context, and run a full commercial review alongside your existing process. Your team does not change how they work. Nexus runs in parallel, assembles the commercial intelligence view, and surfaces it for your procurement leads. At the end of the pilot, you will know whether the commercial intelligence views give your team something they did not have before. If they do, we talk about phase two: live ingestion from your e-sourcing platform and real-time commercial monitoring. If they do not, we have spent two weeks and you have a clear answer. We think the answer will be yes. We would like to find out together."

### Full Written Version (suitable for a follow-up email)

---

Subject: Nexus Pilot — Next Steps from Today's Commercial Intelligence Demo

Thank you for the time today. I want to summarise what we showed you and what we are proposing as a next step.

**What Nexus does**

Nexus is a procurement intelligence platform built around the sourcing event lifecycle. For every managed services or technology RFP your team runs, Nexus assembles a commercial intelligence view: vendor pricing normalised to a common comparable basis, commercial risk flags surfaced before the award decision, BAFO leverage identified from the submission data, and a readiness assessment that tells your team whether the commercial picture is complete enough to support an award recommendation. The platform is orchestrated by four agents — Nexus, Sentinel, Atlas, and Steward — each responsible for a distinct analytical domain, with a structured handoff to human decision-makers at each stage.

**What you saw today**

The demo ran on a deterministic seed — a fixed, authored dataset representing an AMS consolidation sourcing event. Every price, risk flag, and posture assessment you saw was representative fiction: designed to illustrate the platform's analytical vocabulary, not to claim real market data. The seed approach is intentional. It means you can evaluate the platform's commercial intelligence logic — the normalisation, the risk detection, the BAFO framing — without the risk of a live data failure and without requiring access to sensitive vendor data.

**What we are proposing**

We would like to run a two-week pilot alongside one active sourcing event from your current pipeline. The ideal candidate is a managed services re-bid or technology consolidation where the commercial complexity is high — multiple vendors, complex pricing architectures, significant multi-year commitment. We configure the platform with your category context, map your vendor submissions to the commercial intelligence model, and run the analysis in parallel with your existing process. Your procurement team sees the commercial intelligence views — pricing comparison, risk flags, BAFO levers, readiness checklist — alongside their existing evaluation materials.

The pilot has three success criteria. First: does the pricing normalisation give your team a more defensible commercial comparison than the approach you are currently using? Second: does the risk detection surface any commercial flags that your team would not have identified independently? Third: does the BAFO strategy give your team more specific negotiation leverage than a general price-improvement request?

At the end of the pilot, we review the results together. If the answers are yes, we scope phase two: live ingestion from your e-sourcing platform so that Nexus populates from your actual submission data, and real-time control-tower monitoring so that commercial signals are surfaced as the event unfolds. If the answers are no, you have a clear answer after two weeks.

We are confident the answers will be yes. We would like the opportunity to prove it. Please reply to this email or use the link below to schedule a 30-minute scoping call. We will come prepared with a category configuration proposal and a pilot timeline.

---

*Nexus Procurement Platform — Wave 16 demo build. All demo data is deterministic seed fiction. No live vendor data, no real pricing benchmarks, no live AI computation during demo.*
