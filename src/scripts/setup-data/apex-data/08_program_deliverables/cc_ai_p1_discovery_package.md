# Contact Center AI 2026 — P1 Discovery Package (Working Draft)

**Program ID:** apex-cc-ai-2026
**Phase:** P1 Discovery — in flight
**Document version:** 0.4 (working draft, not gate-ready)
**Updated:** 2026-04-22
**Author:** Priya Iyer (program lead) + working group

> This is a working draft of the P1 Discovery package. Some sections are complete, some are partial, some have known gaps. Gate review (P1 → P2) is targeted for 2026-06-15.

## 1. Stakeholder map (complete)

| Role | Person | Engagement |
|---|---|---|
| Sponsor | Jennifer Park (CMO) | Confirmed; bi-weekly |
| Co-sponsor | David Okonjo (COO) | Confirmed; monthly |
| Program lead | Priya Iyer (VP Digital) | Daily |
| Technical lead | (TBD) — Senior engineer in Priya's org | TBD |
| Customer service operational owner | Brendan Fox (Director CS Ops) | Weekly |
| WFM Lead | Mariana Rojas (Sr. Mgr WFM) | Confirmed as design partner; weekly |
| AI Governance | Elena Fischer (Director AI/ET) | Bi-weekly |
| Data engineering | James Wright (VP Data Eng) | Bi-weekly |
| Privacy | Rebecca Singh (GC) | As needed |
| Vendor management | Nathan Kohl (VP Procurement) | Bi-weekly |

## 2. Current-state assessment (partial)

### 2.1 Volume baseline

Total contacts FY2025: 4.2M (across voice, chat, email, social — voice and chat are 78% of volume).

| Channel | FY2025 volume | % of total | Trend |
|---|---|---|---|
| Voice (inbound) | 2.4M | 57% | Slight decline (-3% YoY) |
| Chat | 880K | 21% | Growing (+14% YoY) |
| Email | 540K | 13% | Stable |
| Social | 380K | 9% | Growing (+22% YoY) |

### 2.2 Top 12 call intents (covers 73% of voice volume)

Workshop output, 2026-04-15. Validated against NICE intent classification + agent sampling.

| Intent | Volume share | Current containment | Current handle path |
|---|---|---|---|
| Order status | 18% | 38% (IVR) | IVR (38% containment) → agent (62%) |
| Returns / exchanges | 14% | 12% (web self-serve) | Mostly agent (88%) |
| Item availability | 9% | 22% (IVR + chat) | Mixed |
| Loyalty account / balance | 7% | 64% (IVR + app) | High self-serve |
| Promo / discount inquiry | 6% | 8% | Mostly agent |
| Payment / billing | 6% | 18% | Agent |
| Shipping issues | 5% | 4% | Almost all agent |
| Sizing / fit questions | 4% | 0% | All agent |
| Store hours / location | 4% | 88% (IVR + Google) | High self-serve |
| Order modification | 3% | 6% | Mostly agent |
| Account login / password | 2% | 42% (web reset) | Mixed |
| Cancellation | 2% | 0% | All agent |

**Coverage:** these 12 intents cover 80% of voice volume. The remaining 20% is fragmented across ~40 secondary intents.

### 2.3 Containment baseline (in progress — confidence concern)

**Known issue:** the containment % reported by NICE differs from the IT-built containment dashboard. Discrepancy of approximately 4-6 percentage points. Investigation in progress (James Wright owning).

Hypothesis on the discrepancy: NICE counts certain abandoned calls as "contained"; IT's dashboard treats them as "abandoned" separately. Resolution required before P1 gate close because the entire business case hinges on accurate baseline.

**Tentative consolidated baseline:** 28% containment (using IT dashboard methodology). This is the number cited in P0 charter.

### 2.4 AHT baseline

Current FY2025 AHT: **7.2 minutes** (up from 6.4 minutes in FY2024).

Increase attributed to:
- Easier calls being deflected to self-serve (so harder calls reach agents)
- Returns volume growth driving longer interactions
- New agent ramp time (~22% of agents have <12 months tenure)

### 2.5 CSAT baseline

CSAT FY2025: **4.1** (down from 4.3).

Caveats noted: CSAT is measured 24h post-interaction with 22% response rate. Biased toward extreme experiences. Not directly comparable to other touchpoint CSAT.

## 3. Architecture sketch (partial)

### 3.1 Current state

```
[Customer] --voice--> [NICE CXone IVR/IVA] --(38% deflected)--> [end]
                                          --(62% to agent)--> [Agent on NICE/Salesforce desktop]
                                                                ↓
                                                              [Salesforce Service Cloud — case]
                                                                ↓
                                                              [Resolution path varies by intent]
```

### 3.2 Target architectures (3 options to weigh in P2)

**Option A — Conversational AI in IVR (vendor-led)**
```
[Customer] --voice--> [Conversational AI layer (Five9 + AI / NICE Enlighten / SF Einstein)] --(target 40% contained)--> [end]
                                                                                            --(60% to agent)--> [Agent on enhanced desktop]
```

**Option B — Agent-assist copilot**
```
[Customer] --voice--> [NICE CXone IVR — modest improvement] --(deflection ~30%)--> [end]
                                                            --(70% to agent)--> [Agent + AI copilot suggesting responses, drafting summaries]
```

**Option C — Channel-by-channel rollout**
```
Phase 1: Chat self-serve enhancement (digital channel only)
Phase 2: Voice IVA improvement
Phase 3: Cross-channel agent assist
```

## 4. Pattern-specific evidence (partial)

The pattern-specific evidence required for the Contact Center AI archetype:

- ✅ Intent inventory captured
- ⚠️  Containment baseline — measurement quality issue, blocking
- ⚠️  Representative transcripts — sample of 50 transcripts collected; awaiting privacy review for AI training use
- ❌ Current cost-per-contact baseline — not yet captured
- ❌ Agent cohort skill mapping — not yet captured (needed for agent-assist scope)
- ❌ Hallucination control architecture — not yet drafted (needed for AI Governance Council pre-review)

## 5. Contradictions surfaced

1. **Two containment metrics disagree.** NICE-reported vs. IT-dashboard-reported containment differ by 4-6pp. Cannot proceed to P2 until reconciled.
2. **Agent utilization is at 84% (above 80% target) — but adding self-serve will raise utilization further** since easy calls are the ones getting deflected. The CC AI program's success criteria do not currently address this; the WFM Lead has flagged it.
3. **The 12% deflection target uplift implies $1.8M savings** but the savings calculation assumes agent capacity is freed and not back-filled. In practice, easier-call deflection often leads to higher AHT on remaining calls (the easy ones leave; the hard ones remain), partially offsetting savings.

## 6. P2 readiness recommendation (preliminary)

**Recommendation:** P2 gate close is at risk for original target date (2026-06-15) due to the containment baseline measurement gap. Recommend either:

- (a) Extend P1 by 4 weeks to resolve baseline measurement (preferred)
- (b) Enter P2 with the baseline gap explicitly documented as a P2 blocker (not preferred)

Currently driving toward (a).

## 7. Gaps to close before P1 gate

- ✅ Stakeholder map complete
- ⚠️  Containment baseline measurement reconciliation
- ⚠️  Cost-per-contact baseline
- ⚠️  Privacy review on transcript use for AI
- ❌ Agent cohort skill mapping
- ❌ Hallucination control architecture sketch
- ❌ Sponsor briefing prep for P2 readiness call

## 8. Open issues

1. WFM Lead is engaged but expressing skepticism about full IVR replacement. Position: prefers Option B (agent-assist) over Option A. This is healthy dissent and is on record.
2. Privacy review on transcript use for AI training is in queue at GC office; expected resolution by 2026-05-15.
3. Architecture review of three options is scheduled for 2026-05-29.

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 0.62 (working draft; multiple known gaps)
- Last reviewed: 2026-04-22
- Author: Priya Iyer
- Status: Working draft — not gate-ready
