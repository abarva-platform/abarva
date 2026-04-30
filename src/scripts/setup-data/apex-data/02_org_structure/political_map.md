# Apex Retail — Political Map & Coalition Patterns

**Tenant key:** `apex-retail`
**Last updated:** 2026-04-22
**Reviewed by:** Margaret Chen (CFO), Robert Vance (CEO)
**Data classification:** Confidential

This document captures known coalition patterns, recurring disagreements, and political dynamics that affect transformation programs. It is reviewed quarterly. Information here is sensitive and is not to be shared outside the executive team.

## Coalition patterns

These are the recurring alignments that show up in major decisions:

**The cost-discipline triad: CFO + CISO + IT Procurement (Margaret Chen + Sarah Whitfield + Nathan Kohl)**

These three usually align on cost takeout, vendor consolidation, and resistance to scope expansion. Together they have effective veto power on programs over $5M. Active in:

- AMS Consolidation 2026 (driving aggressive vendor discipline)
- Vendor renewal cycles (typical posture: walk-away credible, BAFO discipline)
- AI vendor evaluation (legal + security joint gate)

**The customer-experience coalition: CMO + CDO + VP Digital + VP Stores (Jennifer Park + Lynne Stratham + Priya Iyer + acting/Brandon Hayes)**

These leaders push for customer-facing investment. Powerful when revenue growth is healthy; weakens when CFO is in cost-takeout mode (as currently).

- Sponsoring CDP Activation 2026
- Co-sponsoring Contact Center AI 2026
- Skeptical of AMS Consolidation's pace (worry it slows customer-facing work)

**The supply-chain advocacy duo: COO + CSCO (David Okonjo + Michael Tanaka)**

Pushing for supply-chain modernization investment that has been chronically deprioritized. Currently sponsoring Demand Forecasting Modernization 2026.

- Sometimes friction with the CMO over investment priorities
- Sometimes friction with the CFO over capex requests

**Legal-and-CISO joint gate: General Counsel + CISO (Rebecca Singh + Sarah Whitfield)**

Collaborate on every AI initiative through the AI Governance Council. Killed two AI vendor demos in 2025 (an HR-screening tool and a dynamic-pricing pilot). Strong veto power on programs that touch employment or pricing decisions.

## Known disagreements

**CMO vs CFO on digital marketing budget**

Jennifer Park (CMO) is fighting for digital marketing budget restoration. Margaret Chen (CFO) is holding the line on FY2026 cost takeout. Specific tension: a planned $4.2M increment for performance marketing in Q2 was deferred to "Q3 if margin trajectory permits." Surfaces in apex-cdp-2026 P3 design discussions because the CDP business case partly hinges on marketing-efficiency improvement.

**CSCO vs CMO on investment priorities**

Michael Tanaka (CSCO) has been advocating for supply-chain instrumentation modernization for 18 months and has been losing to customer-facing investment. The Demand Forecasting Modernization 2026 program represents his first significant budget win. Tension surfaced in February 2026 when the CMO requested CDP scope expansion that would have pulled $1.5M from the demand forecasting budget; this was not approved by CFO.

**CIO vs CDO on AI platform strategy**

Carlos Rivera (CIO) and Lynne Stratham (CDO) have not yet aligned on AI platform strategy. Carlos prefers a pragmatic build-on-existing-stack approach; Lynne is advocating for a more substantial AI platform investment (vector store, model platform, governance tooling). Currently being worked through the AI Governance Council; expected resolution by July 2026.

**Merchandising vs Data on demand forecasting modeling**

Angela Foster (CMO/Merchandising) is publicly supportive of forecast modernization but privately skeptical of pure-data approaches that ignore taste/curation. This will surface in apex-forecast-2026 P3 (Design) when modeling decisions are made. Pattern from past initiatives: she will push for human-in-the-loop, not full automation.

## Champion / Blocker map for active programs

| Program | Champion(s) | Blocker(s) | Neutral but watching |
|---|---|---|---|
| apex-cdp-2026 | CMO, CDO, VP Digital | CFO (on cost), CSCO (on relative priority) | CIO, CISO, GC |
| apex-cc-ai-2026 | CMO, COO, VP Digital | None active (early stage) | CFO (cost), GC (governance), CSCO |
| apex-ams-consolidation-2026 | CIO, CFO, IT Procurement, COO | None named, but COO carries memory of 2023 failure | All others |
| apex-forecast-2026 | CSCO, COO, CMO/Merch (cautiously) | CFO (timing — wants margin recovery first) | CIO, CDO, GC |

## Decision committee dynamics

**Executive Committee** (CEO + direct reports + selected VPs): meets bi-weekly. Robert Vance (CEO) runs it; debate-tolerant; decisions usually taken by CEO after open discussion. Material decisions documented and circulated within 48 hours.

**Investment Committee** (CEO, CFO, COO, GC): chaired by CEO; quarterly cadence; approves all programs over $5M total cost. Currently focused on FY2026 capital discipline.

**Risk Committee of the Board**: chaired by Audit Committee chair (independent director Marcus Holloway — note: same name as previous CDO is coincidence; different person, retired retail CFO from Nordstrom). Reviews material risk decisions. AI Governance Council escalates to this committee.

**AI Governance Council**: see `it_leadership.json`. Internal-only; not a Board committee; chaired by GC.

**Architecture Review Board**: chaired by Linda Mwangi (VP EA); meets weekly; reviews every program in P2 (Synthesis) and P3 (Design). Stricter discipline since the 2023 AMS failure.

## Recent leadership changes and implications

**CDO transition (October 2025)**: Lynne Stratham replaced Marcus Holloway. Implications:

- The new CDO is still building credibility; less veto power than her predecessor would have had at this point in major program decisions.
- The CDP Activation 2026 program is partly her credibility test. Successful execution strengthens her hand for FY2027 investment requests.
- Some institutional knowledge from the prior CDO's tenure is lost; specifically around the customer data inventory work he had started in early 2025.

**VP Store Technology open**: vacant since January 2026. Implications:

- Store technology decisions are being made by Brandon Hayes (acting director) with support from Priya Iyer (VP Digital).
- Store-side input on apex-cdp-2026 (which will activate to in-store) is thinner than it should be.
- Recruitment in progress; target close: Q3 FY2026.

**Activist investor (Stoneridge Capital)**: 4.8% position disclosed February 2026. Two private meetings with management. Public position has not shifted. Watching for proxy implications at the June 2026 annual meeting. Not currently affecting program decisions; may affect FY2027 budget posture.

## Patterns the platform should be aware of

1. **Sponsor reality vs sponsor name.** The named sponsor on every program is real and engaged; this is not Apex's failure mode. Apex's failure mode is more about budget contestation between executive priorities than about phantom sponsorship.

2. **Vendor skepticism post-2023.** The 2023 AMS consolidation failure created lasting vendor skepticism in the CIO and CFO. This shows up as: more rigorous BAFO discipline, more conservative scope, more attention to exit terms in contracts. It also shows up as occasional excessive caution that delays programs.

3. **Architecture review as the real gate.** Linda Mwangi's architecture review board is, in practice, the strongest gate on Apex programs — stronger than the formal Investment Committee in shaping what gets built. Programs that fail to engage her early stall.

4. **Customer-experience-vs-supply-chain tension.** This is the structural budget tension at Apex right now. Most contradictions in active programs trace back to this fundamental allocation question.

5. **Slow culture.** Apex moves deliberately. The CEO's debate-tolerant style means decisions take time. Programs that try to compress timeline aggressively run into culture friction.

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 0.85 (political dynamics are inherently subjective; this represents collected observation, not objective fact)
- Last reviewed by: Margaret Chen, CFO
- Last reviewed at: 2026-04-22
- Access: CEO + direct reports only; not visible to board; not exported
- Next review: 2026-07-22
