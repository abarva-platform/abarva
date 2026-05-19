# Apex-Realness Audit · Contact Center AI Routing Move

**Move:** Contact Center AI Routing — Apex Retail Group — phase **P3 Design**
**Purpose:** Determine, per data point, what baseline data *genuinely exists* in
Apex's seeded substrate so the Expert Kernel grounds the business-case skeleton
honestly — present vs. partial vs. absent. No invention. Absent data is a
**seed gap**, surfaced, never fabricated.

**Audit method.** A SELECT-only DB probe was authored
(`src/scripts/audit-apex-contact-center-realness.ts`). In this build
environment `DATABASE_URL` / `.env.local` were not provisioned, so the live DB
could not be reached. The audit therefore reads the **canonical seed sources**,
which are the authoritative record of what is loaded for this tenant:

- `scripts/seed-apex-demo-move.ts` — the Move, deliverables, milestones, squad.
- `src/scripts/setup-data/apex-data/` — the Apex setup-data layer (KPI
  dictionary, IT financials, vendor contracts, operating telemetry).
- `docs/strategy/scenarios/SCENARIO-APEX-CONTACT-CENTER.md` — scenario intent.

The probe script is committed so the same audit can be re-run against the live
DB once credentials are present; it would confirm row-level presence.

---

## Verdict table — per data point

| Data point | Status | Source of truth | Notes |
|---|---|---|---|
| Move program record (P3 Design) | **Present** | `seed-apex-demo-move.ts` — `MOVE_NAME = 'Contact Center AI Routing'`, phase P3 | Squad of 5, deliverables P0–P3, milestones all seeded. |
| Phase trace + gates P0→P2 | **Present** | seed script `GATES` array | P0/P1/P2 gates completed; P3 gates in progress / not started. |
| Milestones (Arch Council 05-15, Privacy review 05-17) | **Present** | seed script `MILESTONES` | Two upcoming P3 milestones seeded with dates. |
| Average Handle Time (AHT) | **Present** | KPI `kpi:apex:019` — 7.2 min, target 6.5, confidence **High** | Up from 6.4 (FY2024); rising because easy calls are deflected. |
| Contact Center Containment | **Partial** | KPI `kpi:apex:018` — 28%, target 40%, confidence "Medium — see caveats" | **Known measurement discrepancy** between NICE and IT dashboard; reconciliation owned by James Wright, due 2026-05-08. Treat as partial. |
| First Call Resolution | **Present** | KPI `kpi:apex:020` — 68%, target 75% | Lagging; same caveats as containment. |
| Agent Utilization | **Present** | KPI `kpi:apex:021` — 84%, target 80% | Above target — capacity strain; bounds the labour-takeout case. |
| CSAT (post-interaction) | **Present** | KPI `kpi:apex:012` — 4.1/5, target 4.4 | Down from 4.3; 22% response rate, extreme-experience bias. |
| Customer NPS (post-interaction) | **Present** | KPI `kpi:apex:011` — 42, target 50 | Down from 48; same survey caveats. |
| Repeat transfer rate / 7-day repeat contact / CSAT-after-transfer | **Present** | Move P2 baseline deliverable (`baseline_metrics` module) — 18.4% / 31.2% / 3.7 | Decision-grade per the deliverable; one caveat (Spanish-language under-sample). |
| Call volume (contacts/period) | **Absent — seed gap** | not in KPI dictionary, telemetry, or the Move baseline | No absolute contact-volume figure is seeded. Needed to convert AHT/containment deltas into FTE-hours. |
| Channel mix (voice/chat/IVR split) | **Absent — seed gap** | not seeded as a structured figure | Containment note says current containment is "IVR + chatbot" but no split is recorded. |
| Cost-per-contact / labour cost baseline | **Absent — seed gap** | **Explicitly not yet captured** — action item "Capture cost-per-contact baseline", owner Brendan Fox, **due 2026-05-15** (`recent_meeting_notes.md`) | The tenant itself acknowledges this gap. This is the single highest-leverage missing input for the value case. |
| QA error rate | **Absent — seed gap** | not in KPI dictionary or telemetry | No quality-assurance defect-rate metric is seeded for the contact centre. |
| Transfer rate (general, beyond repeat-transfer) | **Partial** | only *repeat* transfer rate (18.4%) is seeded | A first-pass transfer rate is not separately recorded. |
| CC technology spend | **Present** | `it_spend_breakdown.csv` — "Contact Center AI 2026" Transform line $2.4M FY2026 planned ($0.3M FY2025); "NICE CXone" $820K run | Program funding and the incumbent platform run-cost are both seeded. |
| `it_financials` segment overall | **Present** | `04_it_financials/` — capital plan, spend breakdown, renewal calendar, funding-authority matrix | Funding authority and approval routing exist; **no CC-specific capital line** — the $2.4M Transform line is the program envelope. |
| Vendor context | **Present** | `vendor_scorecards.csv` — NICE ($820K, "aging, replacement considered"), Five9 ($120K pilot), Salesforce ($3.29M), AWS, Anthropic, OpenAI | Incumbent + pilot + LLM providers all seeded with spend, risk, renewal dates. |
| Solution archetype / root causes | **Present** | Move P2 root-cause + P3 design deliverables | Three ranked root causes; archetype = human-in-loop assistant first. |
| Sponsor chain | **Present** | seed squad — Carlos Rivera (CIO), Lynne Stratham (CDO), Maya Reyes (VP Customer Care) | Executive + data + care sponsors all named. |

---

## Summary — what the skeleton can ground vs. must flag

**Genuinely real (ground the skeleton on these):**
AHT, FCR, agent utilization, CSAT, NPS, repeat-transfer/repeat-contact/CSAT-after-transfer,
CC technology spend ($2.4M Transform envelope, $820K NICE run), vendor landscape,
the Move record, phase trace, milestones, squad, root causes, archetype.

**Partial (use, but carry the caveat):**
Containment (28%) — real but a NICE-vs-IT measurement discrepancy is open;
general transfer rate — only the repeat-transfer slice is seeded.

**Absent — declared seed gaps (the skeleton must show these as gaps, not numbers):**

1. **Cost-per-contact / labour cost baseline** — the tenant's own action item,
   due 2026-05-15. Highest-leverage gap: without it the value case cannot be
   monetised to a hard dollar figure, only to an operational-hours range.
2. **Absolute call/contact volume** — needed to convert AHT and containment
   point-deltas into FTE-hours and dollars.
3. **Channel mix split** — voice/chat/IVR proportions not structured.
4. **QA error rate** — no contact-centre quality-defect metric seeded.

**Honesty consequence for the kernel.** The `baseline-model` records the four
absent items as `not_recorded` with an explicit seed-gap reason. The
`value-forecast` therefore cannot claim a precise dollar return; it expresses
value as an operational-improvement range and the `business-case-compiler`
surfaces "monetisation blocked on cost-per-contact baseline (due 2026-05-15)"
as a first-class kill/assumption criterion rather than inventing a number.

**Seed realism overall: strong but incomplete for a *costed* case.** The Move,
its KPIs, vendor economics, and program funding envelope are real. The specific
unit-economics inputs needed to turn operational deltas into a CFO dollar
figure are a known, tenant-acknowledged gap — exactly the kind of gap the
Expert Kernel exists to surface honestly.
