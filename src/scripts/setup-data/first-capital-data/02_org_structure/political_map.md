# First Capital Financial — Political Map & Coalition Patterns

**Tenant key:** `first-capital`
**Last updated:** 2026-04-28
**Reviewed by:** James Forsythe (CEO), Charlotte Reid (CFO)
**Data classification:** Confidential

This document captures known coalition patterns, recurring disagreements, and political dynamics that affect transformation programs. It is reviewed quarterly. Information here is sensitive and is not to be shared outside the executive team.

---

## Coalition patterns

These are the recurring alignments that show up in major decisions:

**The capital discipline bloc: CFO + Board Finance Committee + institutional investors (Charlotte Reid + David Parkman + Laura Jensen / board majority)**

Charlotte Reid and the Board's audit and finance oversight function together as the primary constraint on all discretionary spend. Together they have effective veto power on any program budget revision above $5M and can force Board Finance Committee review for anything that moves total FY2026 committed investment beyond the $38M plan Charlotte Reid presented in Q4 2025.

Current context: total FY2026 committed spend is $46.5M across five programs — $8.5M above Charlotte's plan. This bloc has not formally rejected the incremental spend but has not approved it either. Charlotte is presenting a unified investment plan to the Board Finance Committee on 2026-05-31. Until that decision clears, all five program P-gate advances carry funding contingency.

Active posture on programs:
- Skeptical of fcfi-wealth-2026 ($7.8M budget widely viewed as understated; real cost likely $12–15M; incremental $4.2M+ pushes the total above Board approval threshold)
- Closely watching fcfi-core-2026 ($54M total over four years; the largest single investment in the company's history; any overrun has dividend and capital ratio implications)
- Supporting AML remediation (fcfi-aml-2026) as unavoidable regulatory cost, not discretionary investment

Known veto situations:
- Any program gate that increases total FY2026 technology/regulatory spend above $46.5M requires CFO co-sign or Board Finance Committee approval
- Programs seeking revised budgets above $10M require Board approval by standing policy
- If dividend payout ratio exceeds 55% due to investment spend (currently at 53.8%), the bloc will seek to defer or phase discretionary programs

---

**The digital transformation coalition: CDO + CBO + Board Technology Committee (Vincent Morales + Robert Landon + Laura Jensen)**

Vincent Morales (CDO) and Robert Landon (CBO — Consumer & Retail) are aligned on the outcome: higher digital adoption, more digital account opens, reduced branch cost structure. They diverge on pacing and on architecture. Robert Landon wants digital adoption to absorb branch closures; Morales wants branch closure to be deferred until digital adoption channels are proven. Laura Jensen (Board Technology Committee Chair, former SVP CTO at Silicon Valley Bank) has credibility with both of them and has offered to facilitate.

The coalition's push is blocked by three independent constraints:
1. FiServ Cleartouch cannot expose the APIs the CDO's design requires (technical, not political — documented by Deloitte Q4 2025)
2. The CIO (Karen Nakamura) has submitted a competing architecture blueprint that is incompatible with the CDO's
3. Charlotte Reid has not released budget for the $5.5M incremental scope the CIO believes is necessary beyond the approved $18.5M

Active posture on programs:
- Driving fcfi-digital-2026; blocked at P3 gate (architecture conflict, sig:fcfi:006)
- Aligned on the end state for fcfi-core-2026 but split on vendor (see CDO vs CIO conflict below)
- Morales views data governance (fcfi-data-gov-2026) as an enabler he does not own; limited engagement

Known veto situations:
- Robert Landon controls the branch network and digital enrollment channel. If he proceeds with 6 branch closures in Q2/Q3 2026 before digital enrollment scales, the CDO's 78% adoption target for Q4 2026 becomes unachievable. No formal arbitration mechanism exists between their plans.

---

**The regulatory compliance coalition: CCO + CRO + CEO (Patricia Holbrook + Marcus Osei + James Forsythe)**

The November 2025 OCC examination produced 2 MRAs and 1 MRAC — a result that placed First Capital on a quarterly progress review schedule through 2026. Patricia Holbrook (CCO/BSA Officer) and Marcus Osei (CRO) are both directly accountable to the OCC on different MRA elements and are tightly coordinated. James Forsythe is involved personally because the OCC relationship is a CEO-level matter at this asset size.

This coalition has effective priority authority over everything else: when regulatory remediation deadlines and discretionary program milestones compete for the same technology resource, AML/compliance wins. This was formalized in April 2026 when the PMO presented a resource scenario showing 112% utilization and Marcus Osei asserted the AML program's Q4 2026 OCC deadline is non-negotiable.

Active posture on programs:
- Owns and prioritizes fcfi-aml-2026
- Claims downstream dependency on fcfi-data-gov-2026 (AML transaction monitoring tuning cannot close without governed data layer)
- Supportive of fcfi-core-2026 only insofar as it enables regulatory reporting improvement; not driving the agenda

Known veto situations:
- Patricia Holbrook is both sponsor and lead on fcfi-aml-2026 — a governance gap documented in sig:fcfi:003. With no independent sponsor above the program, there is no escalation path if she is incorrect about scope or pace. Marcus Osei has been proposed as sponsor (with Holbrook as lead) to resolve this; CEO has not acted.
- If the OCC returns in Q4 2026 and finds insufficient progress, formal enforcement action (consent order or MOU) is the next step. This would impose external oversight on the entire technology investment agenda — effectively overriding the capital discipline bloc.

---

**The core banking vendor split: CDO faction (Temenos Infinity) vs CIO faction (Jack Henry Banno)**

This is not a coalition in the usual sense — it is an active two-person conflict (Vincent Morales vs Karen Nakamura) that has stalled the single most consequential decision in the company's five-year investment plan.

Morales's position: Temenos Infinity is cloud-native, composable, FDX-compliant, and the right architecture for a digital-first bank. It also happens to be the vendor best suited to the CDO's digital program architecture. His credibility as CDO is partly contingent on this choice.

Nakamura's position: Jack Henry Banno is an integrated stack with lower implementation risk, proven track record at banks of comparable asset size, and fewer dependencies on cloud-native migration readiness (which FCF does not yet have). She inherited legacy infrastructure debt and is conservative about bet-the-bank technology choices.

Note: the programs.json lists Temenos, Jack Henry, and Q2 Holdings as vendors for fcfi-digital-2026, and Temenos and Finxact as finalists for fcfi-core-2026. The CDO-CIO conflict maps onto these evaluations: Morales prefers Temenos for both programs; Nakamura prefers Jack Henry for digital and is agnostic between Temenos and Finxact for core.

Laura Jensen (Board Technology Committee) has offered to facilitate. James Forsythe has been deliberately slow to arbitrate. Six weeks of delay have already accrued at the P3 gate as of the March 2026 signal capture. The risk of continued delay compounding is real: each week of architecture stalemate at P3 pushes the P4 Build gate further into Q3 2026, compressing implementation lead time before the digital adoption targets are measured at Q4 2026.

---

## Known conflicts

**CDO vs CIO — architecture and vendor selection**

Who has what stake: Morales's stake is strategic credibility. He is First Capital's first CDO, hired October 2024 (see executive_bench.json: tenure_start 2024-02-01), and his early record depends on delivering a recognizable digital transformation. If the core and digital programs adopt Temenos Infinity — his preferred vendor — he owns the outcome. If Jack Henry Banno wins, Nakamura's architecture judgment has been validated over his, which significantly weakens his standing for future investment requests. Nakamura's stake is execution safety. She inherited a 1998-vintage FiServ core with $12M in deferred infrastructure debt, and she is risk-averse by documented disposition (notes in executive_bench.json: "cautious on AI without governance framework"). Her career risk is a failed implementation, not a missed innovation opportunity.

Current status: sig:fcfi:006, severity MEDIUM, escalated as of 2026-03-01. P3 Design gate stalled. CEO involvement required. Unresolved.

**Patricia Holbrook — circular governance on AML remediation**

Patricia Holbrook is listed in programs.json as both sponsor (a role that should provide independent oversight) and program lead (a role that executes and reports progress) for fcfi-aml-2026. The OCC MRA requires independent model validation — EY has been engaged for that specific deliverable, which partially mitigates the technical risk. But the program-level governance gap (who reviews Holbrook's own judgment about remediation scope and pace) remains open. There is no escalation path if she is wrong about the Q4 2026 close timeline.

Documented in sig:fcfi:003. CEO acknowledged; option under discussion: Marcus Osei as sponsor, Holbrook as lead. Decision pending.

**Branch network vs digital adoption — Robert Landon's 6-closure plan**

Robert Landon's branch optimization program proposes closing 6 branches in FY2026 targeting markets with the weakest branch economics. The problem: those markets (rural Virginia + eastern NC) are also the markets with the lowest digital adoption. The digital program assumes branch-assisted digital enrollment as the primary channel to reach the 78% consumer adoption target. Closing the enrollment channel in low-digital markets before digital enrollment scales removes the mechanism for reaching those customers.

Landon's position: the branch closure economics ($2.8M NPV) are independent of the digital program. The CDO's position: the digital adoption target must be revised down if branches close before digital enrollment is proven. Neither is wrong. The conflict is that two programs with two sponsors have interdependent success metrics and no shared accountability for the combined outcome.

Documented in sig:fcfi:007. No resolution. Robert Landon controls the branch network decision.

**Capital deployment tension — $46.5M committed vs $38M plan**

Charlotte Reid's FY2026 capital model assumed $38M in technology and regulatory investment. Five programs with signed charters have committed $46.5M. The $8.5M gap has not been approved by the Board. Dividend payout ratio is already 53.8% against a 50% target. If all five programs proceed at current pace through Q2 2026 without a Board Finance Committee approval, the company will be in excess of its own capital deployment policy.

Charlotte Reid is presenting the unified investment plan to the Board Finance Committee on 2026-05-31. Until then, every program gate advance that requires incremental spending carries Board-approval contingency.

The institutional investor risk is secondary but real: public investors expect consistent capital return patterns at a bank of this size and profile. An unplanned $8.5M investment surge without a clear ROI timeline — in an environment of NIM compression (4.26% to 4.12% YoY) and rising NPLs (0.54% to 0.82%) — is a harder story to tell.

Documented in sig:fcfi:011.

**Karen Nakamura — bandwidth and circular dependency**

Karen Nakamura is program lead on fcfi-core-2026 and fcfi-data-gov-2026 simultaneously. The problem: both programs depend on each other to make design decisions. fcfi-data-gov-2026 cannot finalize its data architecture until the core banking vendor is selected (documented in sig:fcfi:010 — two quarters of data governance design work suspended). fcfi-core-2026 vendor selection requires architecture validation from the data governance perspective. Nakamura is the single decision-maker for both programs, and the circular dependency effectively means neither can move without the other.

The PMO's April 2026 resource model shows 112% technology team utilization in Q2 2026 across the four programs that share the same delivery team (sig:fcfi:008). Nakamura is managing this team. The CEO needs to arbitrate program priority; the PMO has prepared three sequencing scenarios.

**Thomas Yuen — commercial loan targets vs CRE concentration cap**

Thomas Yuen (Head of Commercial Banking, tenured since 2017) has built the commercial book from $800M to $2.06B and is measured primarily on commercial loan growth. His FY2026 commercial plan targets $840M in CRE. Marcus Osei has imposed an informal CRE growth cap at $850M, which technically permits Yuen's plan but only barely, and puts CRE concentration at 241% of capital — above the 250% level that triggers enhanced MIS reporting requirements under OCC guidance.

Yuen is publicly aligned with the CRE cap; he is not fully aligned in practice (documented in sig:fcfi:005). His incentive structure rewards loan volume, not concentration management. Yuen also carries the legacy of the COMMERCIAL-CRM-2020 failure (see change_failure_record.md) as an inherited context: he joined in 2022 after that CRM went live and found below-30% RM adoption. He did not cause the failure, but he is living with its consequences (low CRM data quality, RMs using Salesforce FSC to log calls but not to manage pipeline).

---

## Decision authority mapping

**Board approval threshold**
Any single program with a total cost above $10M requires Board Finance Committee approval by standing policy. Programs affected as of April 2026: fcfi-core-2026 ($54M), fcfi-digital-2026 ($18.5M approved; $24M estimated by CIO), fcfi-data-gov-2026 ($11.2M). A revised fcfi-wealth-2026 budget of $12–15M would also cross this threshold and require Board approval.

**CEO arbitration — CDO vs CIO architecture conflict**
The CDO-CIO conflict (sig:fcfi:006) is explicitly a CEO decision. Laura Jensen (Board Technology Committee Chair) has offered to facilitate. James Forsythe's pattern is consensus-building before arbitration; he has been deliberately slow to force this decision. Risk: six weeks of delay already accrued at P3; further delay pushes the P4 Build gate past Q3 2026 and reduces the window for any measurable digital adoption improvement before year-end.

If Forsythe does not arbitrate by June 2026, Laura Jensen is the most credible facilitator given her CTO background and her position on the Board Technology Committee. She has the standing to convene a technical panel without requiring CEO authorization.

**OCC regulatory remediation authority**
Patricia Holbrook is the designated lead for all OCC MRA/MRAC remediation under fcfi-aml-2026. She interfaces directly with OCC examiners and owns the Q4 2026 progress report. Marcus Osei holds independent oversight authority as CRO but is currently in the unusual position of being program sponsor while Holbrook is lead — which recreates the circular oversight risk rather than resolving it. The CEO has been advised to formally appoint Osei as sponsor; until that happens, OCC remediation oversight authority is effectively Holbrook reviewing Holbrook.

**Vendor selection — core banking contract**
Any core banking vendor contract above $30M requires joint approval from the Board Technology Committee and the CFO per standing vendor policy. Both finalists (Temenos at $54M, Finxact at $48M) are above this threshold. Laura Jensen (Board Technology Committee Chair) and Charlotte Reid (CFO) are the joint approvers. Karen Nakamura makes the technical recommendation; James Forsythe approves the strategic direction; Vincent Morales has documented objections to Finxact that are on record with the CEO.

**Branch closure decisions**
Robert Landon has proposed the 6-branch closure program. James Forsythe holds final authority on the decision (it is a CEO-level matter at this asset size given community banking relationship implications). The Board Risk Committee is reviewing the plan for CRA compliance and regulatory optics. No formal timeline for CEO decision as of April 2026.

---

## Credibility and influence context

**Vincent Morales (CDO, since February 2024) — credibility still building**
Morales is the company's first CDO. His prior experience at Umpqua Bank and Chime is legitimately strong for a bank of this profile, but he has been at First Capital for only 14 months as of April 2026. He has not yet delivered a visible product win. The digital program (fcfi-digital-2026) is explicitly his credibility test. Losing the architecture decision to Karen Nakamura would be a material setback. Executives who joined before him (Robert Landon, Thomas Yuen, Elliot Greenberg) have longer institutional relationships with the CEO and can outmaneuver him in informal settings. He needs the CEO to arbitrate the architecture conflict; the longer the CEO delays, the more Morales appears unable to drive consensus — which is the CDO's core competency.

**Karen Nakamura (CIO, since April 2023) — established but overstretched**
Nakamura is program lead on two of the five active programs (fcfi-core-2026 and fcfi-data-gov-2026) and owns the shared technology delivery team. Her technical credibility is solid; her execution risk is bandwidth. She cannot meaningfully accelerate either program without resolving the circular dependency between them (see above). She has been appropriately transparent about this constraint — the resource utilization model (sig:fcfi:008) was surfaced by her PMO — but the CEO has not resolved the priority sequencing.

**Diana Stern (Wealth Head, since May 2020) — longest-tenured in current role; realistic about constraints**
Diana Stern is a pragmatist. She understands that the $7.8M wealth program budget is understated — she retained the consultant who identified the $12–15M range — and she has not tried to hide this from Charlotte Reid. She negotiated the pause of the 2021 wealth consolidation attempt (WEALTH-CONSOLIDATION-2021, see change_failure_record.md) and came out of that situation with her credibility intact. Her pattern is to be candid about gaps and to defer to the CFO on budget decisions rather than escalate politically. The risk is that this realistic disposition understates urgency: the platform situation is deteriorating (two advisor departures in 2025, NNM miss of $80M in FY2025) and deference to budget process may allow the deterioration to compound.

**James Forsythe (CEO, since March 2018 — note: executive_bench.json shows tenure_start 2018-03-01) — consensus-builder; slow arbitration risk**
Forsythe's strength is institutional credibility and stakeholder management. His 2018 pivot to mid-market commercial built the commercial book that funds everything else. His weakness in the current transformation context is his deliberate pace on arbitration. Two CEO decisions are currently overdue: the CDO-CIO architecture conflict (six weeks stalled) and the Patricia Holbrook governance gap (four weeks since acknowledgment, no action). Both are documented. A CEO who is unusually slow to arbitrate is not a failure mode when the decisions are genuinely ambiguous — but the architecture conflict has two concrete options and a documented external facilitation offer from Laura Jensen. Continued delay is a choice with compounding costs.

**OCC examiner relationship — strained; quarterly reviews required**
The November 2025 exam results (2 MRAs + 1 MRAC) placed First Capital on a heightened supervision cadence. OCC quarterly progress reviews run through 2026. The relationship is described as improving (Patricia Holbrook's notes in executive_bench.json: "OCC relationship improving") but is not normalized. An integrated remediation plan was submitted to OCC in January 2026 and quarterly progress reports are required. The Q2 2026 OCC progress report is a hard external deadline that constrains the CDO and CIO flexibility to defer AML-adjacent technology decisions.

**Elliot Greenberg (General Counsel, since March 2015) — institutional memory; quiet influence**
Greenberg is the longest-serving member of the management team and the primary interface to the Board beyond the CEO. He is not a sponsor on any active program, but he has quiet influence on governance decisions — including the Holbrook-governance-gap question (sig:fcfi:003), which is fundamentally a legal and oversight structure question. When Forsythe eventually resolves the sponsor/lead structure for AML, Greenberg's read of the OCC's likely view of that structure will carry weight.

---

## Patterns the platform should be aware of

1. **Regulatory urgency as the override.** The OCC relationship and AML remediation deadline are the single most powerful forcing function on resource allocation and sequencing. When regulatory and discretionary program milestones compete, regulatory wins. This means AML gets priority in Q2 2026, and digital and core programs will absorb resource constraints as a consequence.

2. **The CEO's arbitration gap.** Two decisions that require CEO action are overdue: the CDO-CIO architecture conflict and the Holbrook governance structure. Forsythe's consensus-building style is appropriate for many decisions but is compounding delay on decisions where there is no consensus to build — only a call to make.

3. **Circular dependencies compressing decision windows.** Core banking vendor selection enables data governance architecture, which enables AML model tuning, which enables OCC compliance. Karen Nakamura is the decision-maker for all three steps and owns the shared delivery team. The sequencing is not linear; it is a dependency chain that loses time at every link unless one person drives it and CEO priority arbitration resolves the resource constraint.

4. **The capital gap is not resolved.** The $8.5M overage relative to Charlotte Reid's plan is not approved. Every P-gate advance that touches budget is contingent until the May 31 Board Finance Committee decision. Program managers presenting gate decisions between now and June 1 should not assume budget approval is given.

5. **CDO credibility is a fragile X-factor.** Vincent Morales is in his first CDO role. His ability to continue driving the digital agenda depends on a visible early win and on the architecture conflict resolving in his favor (or at least not visibly against him). If the CDO-CIO conflict is resolved by CEO fiat in favor of Jack Henry Banno, expect reduced CDO engagement with programs that require CIO cooperation — which is most programs.

6. **Vendor selection history creates skepticism.** The WEALTH-CONSOLIDATION-2021 failure (see change_failure_record.md) and the AML-RULES-2023 OCC rejection have made both Karen Nakamura and Patricia Holbrook more conservative on vendor commitments and more insistent on independent validation. This is healthy governance behavior, but it creates delays at vendor decision gates that program timelines did not anticipate.

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 0.85 (political dynamics are inherently subjective; this represents collected observation, not objective fact)
- Last reviewed by: James Forsythe, CEO; Charlotte Reid, CFO
- Last reviewed at: 2026-04-28
- Access: CEO + direct reports only; not visible to board; not exported
- Next review: 2026-07-28
