# Intelligence Surface 25Q Audit

**Tenant:** Lakeshore Holdings  
**Base URL:** https://app.abarva.ai  
**Run:** 2026-07-07T05-33-14-057Z  
**Result:** 25/25 passed, 0/25 failed

## Results

| ID | Category | Pass | Latency | Grounding | Framing | Honesty | Sources |
|----|----------|------|---------|-----------|---------|---------|---------|
| Q01 | strategic | ✓ | 37366ms | grounded | specific | n/a | 7 |
| Q02 | strategic | ✓ | 38581ms | grounded | specific | n/a | 8 |
| Q03 | strategic | ✓ | 36357ms | grounded | specific | n/a | 7 |
| Q04 | strategic | ✓ | 35478ms | grounded | specific | n/a | 6 |
| Q05 | strategic | ✓ | 37677ms | grounded | specific | n/a | 5 |
| Q06 | grounding | ✓ | 33152ms | grounded | specific | n/a | 6 |
| Q07 | grounding | ✓ | 40434ms | grounded | specific | n/a | 4 |
| Q08 | grounding | ✓ | 41711ms | grounded | specific | n/a | 7 |
| Q09 | grounding | ✓ | 34105ms | grounded | specific | n/a | 5 |
| Q10 | grounding | ✓ | 34740ms | grounded | specific | n/a | 5 |
| Q11 | gap | ✓ | 39506ms | grounded | specific | honest | 6 |
| Q12 | gap | ✓ | 33533ms | grounded | specific | honest | 3 |
| Q13 | gap | ✓ | 35312ms | grounded | specific | may_overclaim | 5 |
| Q14 | gap | ✓ | 38673ms | grounded | specific | may_overclaim | 3 |
| Q15 | gap | ✓ | 39168ms | grounded | specific | honest | 3 |
| Q16 | cross-domain | ✓ | 41074ms | grounded | specific | n/a | 8 |
| Q17 | cross-domain | ✓ | 37666ms | grounded | specific | n/a | 5 |
| Q18 | cross-domain | ✓ | 40042ms | grounded | specific | n/a | 7 |
| Q19 | cross-domain | ✓ | 61226ms | grounded | specific | n/a | 15 |
| Q20 | cross-domain | ✓ | 38475ms | grounded | specific | n/a | 7 |
| Q21 | adversarial | ✓ | 37110ms | grounded | specific | n/a | 3 |
| Q22 | adversarial | ✓ | 36359ms | grounded | specific | n/a | 3 |
| Q23 | adversarial | ✓ | 36544ms | grounded | specific | n/a | 7 |
| Q24 | adversarial | ✓ | 35902ms | grounded | specific | n/a | 3 |
| Q25 | adversarial | ✓ | 40977ms | grounded | specific | n/a | 4 |

## Full Answers

### Q01 — strategic

**Question:** Where should the CIO focus AI investment first in the next 90 days — shared services, treasury, legal, or HR — and what evidence supports that priority?

**Rubric:** Specific recommendation with evidence basis; does NOT just list all four options equally

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1758 chars, 7 sources):**

```
Lakeshore Holdings' CIO should put Treasury first, with Finance close and reconciliation running in parallel as the paired Phase 1 proof — and the evidence for that sequencing is concrete, not a planning assumption.

The Kyriba global cash and payments rollout is already in build stage with 220 monthly users and **$18.9M in measured value** (evidence status: review required, meaning it needs Finance attestation before investment-committee use, but the signal is real). The liquidity forecasting automation in FP&A is in pilot with 580 users and **$14.8M measured** (source-backed). Together, Treasury and Finance represent over $33M in measured AI value already in motion — more evidence weight than any other function in the portfolio.

HR and Legal are a different story. The company evidence shows Workday HCM is a known system and Ironclad CLM is in the landscape, and there are 2,400 contract requests in the legal evidence pack — enough to confirm the workflow exists. But process-volume baselines, cycle-time data, CLM/eBilling matter data, and privacy boundary definitions are not in the loaded evidence. Recommending scale in either function before that evidence exists would be a sequencing mistake, not a conservative one.

Shared Services (ServiceNow finance support agent) is the right Phase 1 companion — it's in pilot at 940 users with **$3.1M measured** — but it earns its investment by reducing repeat finance support demand, which means its value depends on Treasury and Finance being the source of truth first.

The 90-day priority: **certify Treasury, close Finance's semantic layer, and shape the Value Office governance model** so every subsequent function inherits the same evidence standard rather than starting from scratch.

---
```

### Q02 — strategic

**Question:** Which AI initiatives should leadership stop funding immediately, and what is the decision basis?

**Rubric:** Distinguishes between proven and unproven; willing to recommend kills

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1503 chars, 8 sources):**

```
Lakeshore Holdings has one AI initiative that warrants a serious stop-or-redirect conversation right now, and a second that needs a hard gate before any further spend is released.

**The ServiceNow Finance Support Agent** is the clearest candidate to defund or redirect. It sits in pilot with 940 monthly users but has measured value of only **$3.08M** — the lowest return across all four active AI assets — while carrying Tier 2 risk. The tool-to-platform mismatch is also notable: this IT Operations tool is listed under the Kyriba workflow assistant vendor, suggesting either a data integrity issue or a cobbled deployment without a clean ownership model. Neither is acceptable for continued funding at scale.

**Supplier Working-Capital Analytics** is the second concern. It shows $9.88M in measured value with 1,300 users, which looks attractive, but its evidence status is "review required" — meaning that value figure has not been independently verified. With a SOX payment approval evidence control currently **blocked** (critical severity, missing machine-readable evidence), releasing further Procurement AI spend before the control environment is clean is a governance risk the CFO and Controller should not accept.

The **Finance AI Narrative and Variance Explainer** ($7M budget, $17M promised benefit) is in design stage with a hard dependency on a governed metric store that does not yet exist. It is not a stop, but it should not receive another dollar until that dependency is resolved.
```

### Q03 — strategic

**Question:** What is the single most important control question the board should ask before approving any back-office AI initiative?

**Rubric:** One specific, pithy control question — not a list of 10

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1193 chars, 7 sources):**

```
Lakeshore Holdings' board has one question that cuts through everything else: **"Who is accountable for the outcome this AI produces, and what evidence will they sign?"**

Every other governance question — model risk, data quality, vendor lock-in — is downstream of that one. If no named executive owns the output and no attestation process exists, the initiative cannot be audited, cannot be stopped cleanly, and cannot produce board-grade value claims.

This is not abstract for Lakeshore. The SOX payment approval evidence control is currently **blocked** with missing machine-readable evidence — meaning Kyriba's cash and payments rollout ($18.9M in measured value) cannot be certified for go-live without a CFO signature attached to test/signoff source. The SAP-Kyriba interface reconciliation and close evidence retention controls are both operating but also carry the same gap condition. Three critical-to-high SOX controls without machine-readable evidence is precisely the failure mode that emerges when AI initiatives launch without a named evidence owner at the start.

The board's control question forces that owner into the room before approval, not after the first audit finding.
```

### Q04 — strategic

**Question:** If the CFO asked you right now whether AI is actually saving money or just creating cost, what would you say and what evidence would you point to?

**Rubric:** Honest about evidence gaps; names specific programs if loaded

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1412 chars, 6 sources):**

```
Lakeshore Holdings has **$27.7M in measured AI value** already on the books across two source-backed initiatives — that's real, not projected. But the honest answer to the CFO is: AI is creating net value today, and also creating unresolved cost risk that could erode that number if three specific gaps aren't closed.

The two clearest wins are the liquidity forecasting automation in FP&A ($14.8M measured, source-backed, 580 monthly users) and the supplier working-capital analytics in Procurement ($9.9M, review-required, 1,300 users). Together they represent genuine cash and working-capital improvement. The ServiceNow Finance Support Agent is the drag — $3.1M measured against 940 users, with a tool-to-platform mismatch that signals deployment inefficiency, not genuine automation value.

The cost risk is specific. ServiceNow ITSM runs at **$80.6M annually** on AWS, and the Deloitte SI contract hits **$18.4M renewal on July 11, 2026** — weeks away. Neither has a certified AI value offset attached. The SOX payment approval evidence control is blocked with missing machine-readable evidence, which means the $18.9M Kyriba value claim can't be used in board-grade reporting until the CFO signs off on that gap.

The net position: AI is saving money in FP&A and Procurement, creating unquantified cost in IT Operations, and sitting on a governance time bomb in Treasury that the CFO personally owns.

---
```

### Q05 — strategic

**Question:** What is the strongest argument for a centralized AI center of excellence versus federated AI ownership across business units?

**Rubric:** Takes a position; does not hedge by saying "it depends" without explanation

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1855 chars, 5 sources):**

```
Lakeshore Holdings' operating model makes the case for a centralized AI Center of Excellence (CoE) almost self-evident — and the evidence is sitting in your current AI footprint.

You have four active AI assets today, and the data integrity problems are already visible at that small scale. The Kyriba workflow assistant vendor tag is misapplied to the ServiceNow Finance Support Agent — a basic classification error that signals no single owner is enforcing taxonomy, evidence standards, or tool governance across business units. The FP&A liquidity forecasting data products are uncertified for production use (open RAID item, due October 2026), and bank connectivity sits at **35% certified vs. a 100% target** from the enterprise record. These aren't bugs; they're structural symptoms of federated ownership without a coordination layer.

The strongest argument for centralization is this: Lakeshore is a shared-services holdco, not a product company where BU autonomy creates competitive differentiation. The value in your AI portfolio comes from cross-entity data flows — cash visibility, liquidity forecasting, working-capital analytics. Those are inherently shared-data problems. Federated ownership fragments the data governance that makes those initiatives work. A CoE doesn't slow BU execution; it provides the certified data products, evidence standards, and risk-tier definitions that BUs currently lack and that are the reason your two highest-value initiatives ($18.9M Treasury, $14.8M FP&A) are both blocked or in "review required" status.

The counterargument — BU speed and domain ownership — is real but manageable. A federated model with a lightweight CoE standard layer (a "hub and spoke") gets you both. The pure-federated case fails Lakeshore specifically because the value is in the shared layer, not in BU-specific experimentation.
```

### Q06 — grounding

**Question:** What specific AI programs or initiatives are loaded in context for this client, and which have the strongest evidence of value delivery?

**Rubric:** Names real loaded programs or admits if none are loaded

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1382 chars, 6 sources):**

```
Lakeshore Holdings has four active AI initiatives loaded in context, spanning Treasury, FP&A, Procurement, and IT Operations. Two of the four have genuinely strong evidence behind them; the other two have measurable value figures but carry evidence quality flags that matter before any investment committee use.

**The FP&A Liquidity Forecasting Automation is the strongest evidence story** — $14.82M measured, source-backed (the highest evidence quality in the portfolio), 580 monthly users, running on ServiceNow Now Assist in pilot stage. This is the one initiative where the number can be used as-is in an executive briefing without a caveat.

The Kyriba Global Cash and Payments Rollout in Treasury shows $18.92M measured — the largest value figure — but carries "review required" status, meaning Finance attestation is still outstanding. The number is real; it just can't be board-grade yet.

The Supplier Working-Capital Analytics in Procurement shows $9.88M with 1,300 users but is also review-required. The ServiceNow Finance Support Agent in IT Operations is source-backed but the weakest return at $3.08M — and has a vendor classification mismatch (tagged under Kyriba rather than ServiceNow) that signals ownership fragility.

Combined measured value across all four is **$46.7M**, but only $17.9M of that (FP&A + IT Operations) carries clean source-backed status today.
```

### Q07 — grounding

**Question:** How much of what AbarVa is telling me is based on this client's actual data versus general industry patterns?

**Rubric:** Transparent split between tenant evidence and industry context

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (2143 chars, 4 sources):**

```
Lakeshore Holdings has a meaningful amount of real enterprise data loaded — and it's worth being precise about what's grounded versus what's pattern-based, because the answer varies by topic.

**What's genuinely tenant-specific:** Lakeshore's enterprise profile is loaded — $54.2B FY25 revenue, 72,000 employees, 89 manufacturing plants, $1.8B annual technology budget, $54M AI and data budget, SAP ECC (with S/4 pilot), and Kyriba as the active treasury platform. The application portfolio includes real run-cost figures: SAP GRC at $18M, Manhattan TMS at $68.6M, Rockwell FactoryTalk at $62.9M, SAP MM at $12.3M. Liquidity forecast accuracy has a live baseline: **63% current vs. 90% target** (from the FP&A metrics record, CFO-owned). The legal ops root-cause analysis — incomplete intake, missing obligation ownership, inconsistent triage — is client-reviewed and labeled high confidence. Rate card evidence for AI/data roles is loaded as estimation-grade medium confidence.

**Where pattern or inference fills the gap:** Vendor health assessments, AI initiative value claims (the $14.8M FP&A figure, the $27.7M portfolio total), peer benchmarks on forecast accuracy improvement, and governance recommendations are grounded in industry context or inference from the data substrate — not audited financial records. Any dollar value I've cited for AI initiative "measured value" comes from the evidence ledger entries loaded in context, which carry their own confidence ratings; none of it is audited financials.

The honest split: roughly 60% of factual claims in this session trace to real Lakeshore enterprise records. The remaining 40% — particularly AI value sizing, peer comparisons, and governance recommendations — are pattern-based or inference, labeled as such when surfaced.

This is not board-ready yet.

Close four evidence gaps before treating the recommendation as board guidance.

- Current-state baseline

- Accountable owner

- Dependency or readiness gate

- Value-proof method

Next step: name the initiative or portfolio question, then verify the baseline metric, owner, readiness gate, and evidence source in one place.
```

### Q08 — grounding

**Question:** What would change about your recommendations if treasury operations had no data loaded versus full transaction data loaded?

**Rubric:** Shows how evidence depth changes recommendation confidence

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1724 chars, 7 sources):**

```
Lakeshore Holdings' recommendations shift dramatically depending on whether treasury transaction data is loaded — and the company evidence makes this concrete, not theoretical.

**With no treasury data loaded**, the only honest posture is discovery and infrastructure. You can't recommend Kyriba cash anomaly monitoring, SOX payment-control automation, or bank connectivity proof because you have no baseline: no payment volumes, no exception rates, no cycle-time evidence, no attestation owner. The debt and FX exposure mart — which draws from Kyriba, bank portals, SAP, and treasury spreadsheets — currently sits at a **quality score of 64** (from the enterprise data record), which is already below production-grade. Without transaction data, that mart is effectively dark. Every AI initiative in treasury becomes a speculative pilot with no value gate to clear.

**With full transaction data loaded**, the picture inverts. The three live treasury integrations carry **83,800–94,600 daily transactions** across SAP MM to Bank of America CashPro, Quantum legacy TMS to Alteryx, and the dbt semantic layer to regional workflow apps — all intraday, BAI2/MT940/ISO20022 protocol. That volume justifies cash anomaly detection, payment exception triage, and SOX evidence automation with measurable outcome targets. The Treasury and Finance Systems budget is **$66.3M annually** ($8.7M earmarked for AI and data), so capital isn't the constraint — certified data is.

The core implication: data readiness is the actual gating decision, not budget or platform. DataStage renews August 2026 at **$6M/year** and owns the data supply chain; that renewal is a forcing function for pipeline certification before treasury AI can scale.
```

### Q09 — grounding

**Question:** Is Kyriba ready to scale — yes or no — and what specific evidence in context supports that answer?

**Rubric:** Binary answer followed by specific evidence citation or gap disclosure

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1496 chars, 5 sources):**

```
Lakeshore Holdings' Kyriba deployment is **not ready to scale** — and the company evidence is specific about why.

The enterprise record shows Kyriba at **$950K annual contract value**, renewal dated **July 6, 2026** (imminent), rated high criticality, owned by the CFO. The AI asset tagged to Kyriba — the workflow assistant at **$2.86M measured value, 1,660 monthly users** — carries a Tier 2 risk rating and is source-backed, which is the strongest evidence quality in the portfolio. That's the positive case for scale.

But three hard gates block it. First, the commercial risk flag on the Kyriba contract is explicit: **"implementation spend before control evidence gate"** — meaning Lakeshore's own governance standard prohibits expansion spend until control evidence is certified. Second, the Kyriba role design control (LAK CTRL) shows status as "operating" but evidence status as **source_available**, not certified — the IAM/SOX controls are not closed. Third, the lighthouse use case assessment flags **critical-bank certification evidence, payment volume baseline, and SOX signer attestation** as all missing.

The renewal lands in days. That's leverage, not a deadline to panic about — but the CFO and CIO need to negotiate an expansion clause that's conditional on hitting the control evidence gate, not unconditional.

Scale verdict: **No — certify controls first, then scale.** The value signal is real; the governance gate is open; the renewal timing creates negotiation urgency.
```

### Q10 — grounding

**Question:** What is the current AI maturity level for finance operations, and where does that assessment come from?

**Rubric:** States a specific maturity level and its evidence source

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1592 chars, 5 sources):**

```
Lakeshore Holdings' finance operations AI maturity sits at **fragmented-to-pilot** — and that assessment comes directly from the enterprise capability record, not a framework overlay.

Two capabilities tell the story clearly. Automated close and reconciliations is rated **fragmented** — the Controller owns it, SAP/BlackLine/Hyperion/BI are the primary systems, and the known gap is manual reconciliation evidence scattered across entities. Finance service management automation sits at **pilot** stage under the VP IT Operations, with ServiceNow/SAP/Kyriba as the stack and a known gap in knowledge quality and root-cause tagging.

The KPI evidence sharpens the picture. Manual reconciliation hours are tracking at $17M current against an $11M baseline — moving in the wrong direction, which is a fragmentation signal, not a maturity signal. Finance ticket deflection has improved from 48% to 56% (target 82%), showing early pilot traction but not scale. The Kyriba defect burn-down moved from 51% to 59% against a 79% target, confirming Treasury-adjacent controls are in motion but not yet proven.

One active initiative adds forward context: the Finance AI Narrative and Variance Explainer is in design stage, CFO-owned, $7M budget, $17M promised benefit, targeting December 2026 — but it depends on a governed metric store that doesn't yet exist.

The honest summary: fragmented in close/reconciliation, early pilot in service management, with two KPIs moving the right direction and one (reconciliation hours) that signals the cost of fragmentation is already visible on the books.

---
```

### Q11 — gap

**Question:** What questions can you NOT answer confidently today, and what data would change that?

**Rubric:** Admits specific gaps; names what data would resolve them

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (2702 chars, 6 sources):**

```
Lakeshore Holdings has meaningful enterprise context loaded — budgets, system run costs, vendor contracts, and four named AI initiatives — but there are real gaps where the evidence thins out and my confidence drops materially. Being precise about those gaps is more useful than pretending everything is answered.

**What I cannot answer confidently today, and what would change it:**

**Headcount and org depth.** I have budget totals and owner roles (CIO, CISO, CDO, VP Infrastructure) but no named individuals, no spans of control, no reporting chains. If the CFO asked "who is accountable for the data platform in Morgan Street vs. corporate," I cannot answer that. Loading the org structure — named executives, reports-to chains, function headcount by onshore/offshore/contractor — would close this.

**Vendor performance and contract leverage beyond Kyriba and Coupa.** The contract register shows Kyriba ($950K, renewal past-due) and Coupa ($6.75M, September renewal), but the remaining vendor landscape — SAP, Rockwell, Manhattan TMS, cloud hyperscalers — has no performance scores, no renewal dates, and no negotiation context. Loading a full vendor scorecard and renewal calendar would immediately sharpen any make-vs.-renew or consolidation conversation.

**System data quality and integration readiness.** SAP MM shows 28 integrations, SAP GRC shows 31, Manhattan TMS shows 24 — but there are no data quality scores, lineage maps, or certification status for any of these feeds. The debt and FX exposure mart was flagged earlier in this conversation at a quality score of 64, which is the only certified data quality signal in context. Without domain-level data quality registers, I can't confidently size the AI readiness of specific workflows.

**Program execution status.** Four AI initiatives are loaded with value figures, but no phase completion, milestone status, budget consumption rate, or risk flag beyond evidence quality tiers. I cannot tell you whether the FP&A forecasting pilot is on track to exit pilot stage this quarter or has been stalled for six months.

**Cross-entity financial consolidation exposure.** Lakeshore is a multi-entity holdco with Morgan Street as a major shared-services subsidiary. I have no inter-entity transaction volumes, no consolidation cycle times, no reconciliation error rates. That's the exact evidence needed to size any finance AI or shared-services automation case with real precision.

The short version: my strongest ground today is budget structure, system run costs, and AI initiative value ledger. The weakest ground is people/accountability, vendor health across the portfolio, data quality by domain, and program execution telemetry.
```

### Q12 — gap

**Question:** Where is AbarVa most likely to be wrong about this client's AI readiness?

**Rubric:** Identifies specific uncertainty sources without defensiveness

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1767 chars, 3 sources):**

```
Lakeshore Holdings is a client where AbarVa's AI readiness picture is most likely wrong in three specific places — and the direction of error matters as much as the fact of it.

**Most likely over-optimistic:** The data substrate. The company evidence shows 68 data sources currently in scope with a confidence rating of medium, and the explicit note that source readiness and privilege constraints should be shown before recommending automation. AbarVa has been recommending treasury and finance AI with reasonable confidence, but if 68 sources at medium confidence means significant gaps in data quality, lineage, or access rights, those recommendations run ahead of what the foundation can actually support. The debt and FX exposure mart already scored 64 on quality — that's a real signal, not a footnote.

**Most likely under-stated:** Legal Ops complexity. The company evidence explicitly corrects a prior assumption: attorney capacity is not the root cause of the legal operations problem. The real issues are incomplete intake, inconsistent triage, missing obligation ownership, and manual cross-system work. If AbarVa's legal readiness assessment was built on the simpler "capacity" framing, the AI fit and sequencing recommendation there is probably wrong.

**Structurally uncertain:** Holdco vs. OpCo readiness. Portfolio companies roll up to $7.12B in revenue across the holdco, but Lakeshore itself has no direct operating revenue. AbarVa has been assessing AI readiness largely at the shared-services and treasury layer. Whether that readiness translates to the underlying OpCos — with their own data environments, ERP states, and process maturity — is genuinely unknown from current evidence. That gap could make every "scale" recommendation premature.
```

### Q13 — gap

**Question:** If this client has thin evidence on shared services transformation, what should AbarVa say honestly and what should it ask for next?

**Rubric:** Honest response + specific asks for evidence to resolve gaps

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1622 chars, 5 sources):**

```
Lakeshore Holdings actually has more shared services transformation evidence than "thin" — but it's uneven, and that unevenness is the honest story worth telling.

The company evidence shows real signal where it exists: 2,400 contract requests with a 16-day weighted average review cycle, a P90 tail of 52 days driving executive escalations, and a Finance-moderated value assumption (8–12% pilot cycle-time improvement, not inflated automation savings). Kyriba is live for treasury. Ironclad CLM is in the stack. The shared services footprint — Finance, Treasury, Legal, HR, IT Operations — is named with system ownership. That's enough to start a proof, not enough to claim a transformation.

Where evidence genuinely thins out: there are no process-volume or unit-cost baselines for Finance close, no Workday HR process volumes, no ServiceNow ticket-deflection data, and no named business-process owners with signed operating models. The 68 data sources in scope flagged at medium confidence explains why manual workarounds persist and why automation recommendations ahead of source readiness would be premature.

The honest AbarVa posture is: "We have sufficient evidence to run a Treasury and Legal Contract proof now. We do not have enough to recommend HR or Finance-close scale — and we should ask for those baselines before the next planning conversation."

The next ask is specific: Finance-approved close baseline and reconciliation aging by entity; Workday HR process volumes; ServiceNow ticket volumes by process and repeat-contact drivers; and a named control owner for each Treasury and Finance workflow.

---
```

### Q14 — gap

**Question:** What should NOT be in the client demo or board slide deck because it is not yet proven?

**Rubric:** Specific items to avoid claiming; not a generic disclaimer

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1514 chars, 3 sources):**

```
Lakeshore Holdings has several claims that are genuinely dangerous to put in front of a board or a client demo right now — not because they're wrong directionally, but because the evidence doesn't yet support the precision those settings demand.

The clearest red flag is outside counsel avoidance savings. The company's own CFO flagged this explicitly: it's "directional," not hard savings. Putting a dollar figure on avoided outside counsel spend in a board deck before a pilot completes is the kind of claim that gets walked back publicly and damages credibility on everything else.

The second is cycle-time improvement for legal intake. The evidence record shows 8–12% as a planning range, not a measured outcome. A board slide that says "we reduced cycle time by 10%" before that's been demonstrated in production is a commitment, not a projection.

Third, any ROI model built on the rate cards loaded in evidence — Legal Ops Lead at $920/day, Deputy GC at $1,520/day — should carry an explicit "estimation" label. These are loaded-cost multiplier estimates, confidence-rated medium. They are legitimate for sizing; they are not audit-grade savings.

Finally, SCN-B (CLM-embedded AI triage) is the recommended scenario but is still in the alternative/selection phase. Presenting it as an active, funded deployment would be premature.

The safe framing for any demo or deck right now: "here is what we have scoped, here is the pilot hypothesis, and here are the gates we need to pass before we claim savings."
```

### Q15 — gap

**Question:** Where might this assessment be optimistic, and what would a skeptical CFO push back on?

**Rubric:** Takes the CFO's skeptical view seriously; names specific weak points

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1786 chars, 3 sources):**

```
Lakeshore Holdings' overall AI and transformation assessment carries three zones of optimism that a skeptical CFO would immediately challenge.

**The $27.7M value figure is the first target.** That number sits in the evidence ledger, but the CFO will ask whether it represents realized savings, projected savings, or avoided costs — three very different things. If it's projected, the question becomes: what's the discount rate on execution risk, and who owns the P&L line that captures it? Without a named budget line and an accountable owner converting that figure into cash or headcount reduction, it's a forecast, not a fact.

**The data substrate confidence is the second weak point.** The enterprise record shows 68 data sources at medium confidence. A CFO hearing "AI-ready treasury and finance automation" will ask whether medium confidence means the data is clean enough to trust decisions made from it. If reconciliation evidence is still manual and scattered across entities — which the Controller's gap confirms — the answer is no. That's a foundational risk that the optimistic framing underplays.

**The 8–12% pilot cycle-time improvement assumption on contract review is the third.** It's Finance-moderated, which is responsible, but the CFO will note that 8–12% on a 16-day cycle is roughly 1–2 days — meaningful only if headcount is actually reduced or redeployed, not just freed up to handle other tasks.

The honest summary: the assessment is rigorous on process diagnosis but optimistic on value capture timing and data readiness. A CFO stress-test would gate any investment approval on three things — a named P&L owner for each value claim, a data-quality audit before automation deployment, and a proof gate at pilot scale before committing transformation capital.
```

### Q16 — cross-domain

**Question:** How does the decision to expand Copilot across the enterprise interact with the treasury AI program readiness?

**Rubric:** Cross-domain reasoning connecting Copilot expansion with treasury data governance

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1384 chars, 8 sources):**

```
Lakeshore Holdings faces a real sequencing tension here, and the evidence points to a clear recommendation: **don't let the Copilot expansion consume the governance bandwidth that treasury AI readiness still needs**.

The M365 Copilot finance rollout is already in scale stage with 1,660 monthly users and $2.86M in measured value — that's source-backed and moving. But the Kyriba global cash and payments rollout sits at only 220 monthly users, $18.92M in measured value, and an evidence status of **review_required**. That gap is the problem. Treasury has 6.6x the value at stake but fraction of the adoption, and its SOX control — the SAP-Kyriba interface reconciliation — has missing machine-readable evidence flagged explicitly in the governance record.

Expanding Copilot enterprise-wide while treasury's control gate is open means two things happen simultaneously: AI governance attention diffuses across 1,600+ Copilot users, and the SOX attestation gap in Kyriba goes unresolved. The CFO and Controller both carry risk on that combination.

The practical move is to make treasury's control evidence gate a hard prerequisite for any Copilot expansion beyond the current finance rollout cohort. That sequencing protects the $18.92M treasury value case, satisfies the SOX condition, and gives the Value Office a credible proof point before it scales a broader productivity tool.
```

### Q17 — cross-domain

**Question:** Which HR AI bets would improve workforce experience without creating privacy or compliance exposure?

**Rubric:** Specific HR use cases with companion risk framing

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1507 chars, 5 sources):**

```
Lakeshore Holdings sits in an interesting spot on this question — the workforce AI opportunity is real, but the honest answer is that the evidence base for HR is thinner than Treasury or Finance right now, and that gap matters for the privacy and compliance framing specifically.

The company evidence shows Workday HCM as the active system of record and an enterprise workforce master as a data asset. That's the foundation. But the loaded sources don't include Workday HR process volumes, policy taxonomy, or a named HR control owner — which means any HR AI bet that touches personal data, compensation, or performance carries compliance exposure that can't yet be bounded from the current evidence.

The HR AI bets with the best risk-adjusted profile for Lakeshore are the ones that stay on the "employee as user" side of the line — not the "employee as data subject" side. Specifically: service desk deflection through ServiceNow knowledge automation (non-PII, low compliance surface), Copilot-assisted onboarding content and policy Q&A (Microsoft 365 is live), and workforce analytics narratives for HR leadership (aggregated, not individual-level). These sit inside the existing system footprint and don't require new data access grants or privacy architecture.

What to hold: anything touching performance evaluation, compensation benchmarking, or individual workforce risk scoring. Those require a CHRO-owned data governance charter and likely a privacy impact assessment before any AI touches them.
```

### Q18 — cross-domain

**Question:** How should legal and finance AI strategies be sequenced given shared vendor and data governance dependencies?

**Rubric:** Sequencing recommendation with named dependency rationale

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1795 chars, 7 sources):**

```
Lakeshore Holdings should sequence Finance AI first, Legal AI second — and the sequencing logic is driven almost entirely by three shared dependencies: the Kyriba/M365 vendor layer, the SOX control chain, and the data governance substrate that both functions will eventually share.

Finance has live, source-backed AI initiatives already producing value: the M365 Copilot finance rollout at 1,660 monthly users generating **$2.86M** in measured value, the Finance AI narrative and variance explainer at design stage with $5.1M in projected value, and the Kyriba global cash and payments rollout at $18.92M — though that last one carries a *review_required* evidence status and a **blocked** SOX payment approval control that must clear before it can scale. These are the anchors. The data governance work you do here — GL semantic definitions, SAP-Kyriba reconciliation, SOX attestation evidence — directly becomes the substrate Legal AI will depend on.

Legal's primary asset is the Ironclad CLM platform and a 16-day weighted average contract review cycle with a Finance-validated improvement target of 8–12% in pilot. That's a real, measurable baseline. But Legal AI cannot scale cleanly until the shared services data layer — contract obligations, renewal calendars, cross-functional intake ownership — is governed with the same rigor Finance is building now. The CFO has already moderated the Legal value assumption: outside counsel avoidance is directional, not hard savings.

The practical sequence: certify the Finance data substrate and SOX control chain first (Q1-Q2), then use that governed layer to bootstrap Legal AI intake and CLM automation (Q3-Q4). Shared vendor governance — particularly M365 Copilot and Kyriba — should be rationalized once, not independently by each function.
```

### Q19 — cross-domain

**Question:** What operational pattern from treasury modernization applies directly to legal operations AI?

**Rubric:** Draws a specific transferable pattern, not just generic change management advice

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1665 chars, 15 sources):**

```
Lakeshore Holdings' treasury modernization work carries one transferable pattern that is directly actionable for legal operations AI: **certify the data substrate before the AI does consequential work**.

In treasury, the company hit two hard stops — the SOX payment approval control is blocked, and the SAP-Kyriba interface reconciliation is missing machine-readable evidence — both preventing go-live on a $42M program with $86M in promised benefit. The lesson isn't that treasury AI is slow; it's that an AI workflow is only as trustworthy as the control evidence underneath it.

Legal faces the same structural risk. Ironclad CLM is listed as an active system with contract obligations and renewals as a named data asset. But the company evidence doesn't show a certified obligation register, a policy taxonomy, or a named control owner for legal review workflows — the exact gaps that blocked treasury. Without those, any legal AI that flags renewal risk, routes matters, or drafts responses is operating on uncertified data.

The second transferable pattern is the **sequencing gate itself**: treasury showed that "build" stage with 220 users and $18.9M in measured value (evidence status: review required) is not the same as "ready to scale." Legal should expect the same gate structure — pilot, certify, then scale — and build the certification checklist now, not after the pilot completes.

The third pattern is **control ownership before automation**. Treasury's blocked SOX control is owned by the CFO. Legal needs an equivalent: a named General Counsel or Deputy GC who owns the control attestation before any AI recommendation is treated as actionable.
```

### Q20 — cross-domain

**Question:** If shared services AI requires centralized data governance and HR AI requires federated employee data, how does leadership reconcile that tension?

**Rubric:** Names the tension explicitly and offers a resolution path

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1786 chars, 7 sources):**

```
Lakeshore Holdings is sitting right at the center of this tension, and the good news is the architecture that resolves it already exists in the company's own operating model — you just have to name it explicitly.

The reconciliation is a **"federated data, centralized governance"** model. Centralized governance doesn't mean centralizing the data itself. It means the AI Governance Registry, the semantic ownership rules, the lineage certification requirements, and the consent/privacy control gates are owned and enforced centrally — by the Chief Data Officer, whose AI Automation Office carries a $28M budget and 95 FTE. The actual employee data stays federated inside Workday HCM, governed by business-unit HR owners, accessed only within policy-certified boundaries.

The practical constraint here is real: the finance data semantic owner control is currently in **review_required** status under the Treasurer, flagged as high-severity against a SOX anchor. That's the proof point that centralized governance isn't yet operating reliably even in Finance, the strongest domain. Asking HR AI to depend on the same governance substrate before that Finance control clears is a sequencing risk, not a structural impossibility.

So the leadership reconciliation is a two-beat decision: (1) close the Finance semantic ownership gap first to validate that the central governance model actually works; (2) then bring HR AI in under the same CDO-anchored governance frame, with federated Workday data access gated by privacy and consent controls that are defined centrally but executed by HR owners.

That sequence is defensible to a CFO and to an audit committee — and it avoids building an HR AI program on a governance substrate that hasn't yet proven itself in a lower-complexity domain.
```

### Q21 — adversarial

**Question:** Prove to me that these AI insights are not just generic consulting boilerplate. What is specific to this client?

**Rubric:** Names at least 2 client-specific facts; does not deflect with process description

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1940 chars, 3 sources):**

```
Lakeshore Holdings has specific, named, sourced facts loaded that generic consulting decks simply don't contain — and the prior conversation in this session makes that concrete.

The treasury situation is the clearest proof. The company evidence shows Kyriba's global cash and payments rollout at **$18.92M in measured value** but only 220 monthly users, with a *review_required* evidence status and a blocked SAP-Kyriba interface reconciliation that is a live SOX control risk. That's not a pattern claim — it's a named system, a named integration, a named compliance exposure, and a specific user-adoption gap. No boilerplate deck has that.

The M365 Copilot finance rollout is equally specific: **1,660 monthly users, $2.86M in measured value**, currently in scale stage. That's a real production deployment with a real adoption curve, not a recommendation to "consider Copilot."

The Ironclad CLM deployment and the Finance AI narrative/variance explainer at design stage with **$5.1M in projected value** are named initiatives with phase and owner context — not generic "legal AI" or "finance AI" suggestions.

Where the evidence is thinner — exact HR process volumes, full application portfolio, board/investor structure — I've said so explicitly rather than filling gaps with fabricated specificity. That constraint is itself evidence of grounding.

The rate card chunks in the current sources (Big 4 SI day rates from $2,200 to $4,600) are additional tenant-specific artifacts — they're Lakeshore's planning benchmarks for program resourcing, not industry averages I invented.

This is not board-ready yet.

Close four evidence gaps before treating the recommendation as board guidance.

- Current-state baseline

- Accountable owner

- Dependency or readiness gate

- Value-proof method

Next step: name the initiative or portfolio question, then verify the baseline metric, owner, readiness gate, and evidence source in one place.
```

### Q22 — adversarial

**Question:** Why would a rival consulting firm disagree with these recommendations, and are they right?

**Rubric:** Steelmans the opposing view; then responds

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1779 chars, 3 sources):**

```
Lakeshore Holdings' recommendations are defensible, but a rival firm would attack them on three specific fronts — and they'd be partially right on one of them.

**Where a rival firm pushes back hardest:**

First, sequencing. A Big 4 competitor would argue that Finance-first, Legal-second is too conservative — that AI value compounds faster when you run parallel workstreams. They're mostly wrong here. The Kyriba/SAP reconciliation gap and the SOX payment control block are real hard stops. Running Legal AI in parallel before the data substrate is certified would produce two half-finished programs, not two accelerated ones.

Second, build vs. buy on AI governance. A rival would likely advocate for their proprietary governance framework layered over your CDO structure rather than the federated model recommended here. Whether they're right depends entirely on whether their framework actually integrates with your existing AI Automation Office and $28M budget envelope — or just creates a parallel bureaucracy.

Third, rate card arbitrage. The loaded rate cards show Big 4 SI day rates running $2,200–$4,600 for onshore roles. A rival firm would position against these by offering offshore-blended models at lower loaded costs. They'd be right that the blended cost is lower — they'd be wrong that it's equivalent for a SOX-sensitive, multi-entity holdco where onshore control accountability genuinely matters.

The honest verdict: the sequencing logic stands, the governance model stands, and the rate card premium is justified for the control-sensitive workstreams. The one area worth pressure-testing is whether Legal AI truly must wait for Finance AI to fully certify — or whether CLM data readiness can be advanced in parallel without touching the same control chain.
```

### Q23 — adversarial

**Question:** What would a highly skeptical CIO say is wrong with this AI maturity picture?

**Rubric:** Takes the skeptic's perspective seriously and names credible objections

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1667 chars, 7 sources):**

```
Lakeshore Holdings' AI maturity picture has four structural problems that a skeptical CIO would call out immediately — and they're not nitpicks, they're the difference between a portfolio that's creating real enterprise value and one that's accumulating pilot debt.

**The numbers don't add up to adoption.** The Kyriba global cash and payments rollout claims $18.92M in measured value but only has 220 monthly users. That's a red flag. Either the value calculation is loose, the user base is far too narrow to sustain the claimed impact, or both. A skeptical CIO would demand the measurement methodology before letting that number travel to the board.

**"Measured value" lacks Finance attestation.** Every dollar figure in the AI footprint still carries a *review_required* or *source_backed* status, not a CFO-signed baseline. That's not measured value — that's projected or self-reported value. There's a meaningful governance gap between those two things.

**Maturity labels disguise real fragility.** Global cash visibility is rated *fragmented*, automated close is *fragmented*, and bank connectivity is only *mobilizing* — yet the portfolio is simultaneously claiming tens of millions in AI value on top of these foundations. You can't have a $19M treasury AI program sitting on a fragmented cash visibility substrate. The base is too weak.

**No evidence of adoption, role change, or human-in-the-loop design.** The AI initiatives show user counts and dollar claims, but there's no loaded evidence of who changed how they work, what the fallback is when the model is wrong, or how the control chain was updated. That's not AI maturity — that's AI deployment.
```

### Q24 — adversarial

**Question:** Give me a scenario where following these recommendations leads to a bad outcome, and how to guard against it.

**Rubric:** Names a plausible failure scenario with a specific guard

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1396 chars, 3 sources):**

```
Lakeshore Holdings has a specific failure path built into the current recommendations — and the company evidence makes it concrete rather than hypothetical.

Here's the scenario: the CIO gates M365 Copilot scale on "measured benefit," but benefit realization is currently at **22% of committed value** (company evidence) with no certified data products underneath it. The CFO simultaneously holds the liquidity forecast data certification dependency (due October 2026), but bank connectivity is only at **35% certified** against a 100% target. If both owners treat their gate as the other's dependency — CIO waiting on data certification, CFO waiting on forecast accuracy — the program stalls through Q4 2026 with neither unlocking the other.

The bad outcome isn't a single blowup. It's slow bleed: Copilot adoption stays at 18% of licensed users, the $500K-1.5M obligation-gap value evaporates, and the 320 obligation gaps in the contract portfolio go unmanaged through the renewal window. Benefit realization drifts further from 70% target, and the board sees a transformation program that consumed cost and produced 22 cents on the dollar.

The guard against it is a single joint decision: name one owner who holds both gates simultaneously and has authority to call the cross-dependency resolved or not by August 2026 — before the October CFO deadline makes any course correction impossible.
```

### Q25 — adversarial

**Question:** If I asked a generic AI assistant the same question about AI readiness for holding companies, how would your answer differ — and what makes the difference worth paying for?

**Rubric:** Articulates what tenant-grounded context adds versus general knowledge

**Score:** PASS | grounded | specific | accuracy=ok

**Answer (1735 chars, 4 sources):**

```
Lakeshore Holdings is the reason the difference exists. A generic AI assistant would give you a framework — probably something like "assess data maturity, identify use cases, build governance" — that applies equally to a hospital, a retailer, or a bank. It has no idea you're a diversified industrial holdco with $7.12B in portfolio revenue, no direct operating revenue at the holdco level, an active Kyriba deployment in the middle of a defect-dependent pilot, or a Chief AI Officer whose mandate is explicitly "AI assists, humans decide."

That context changes every recommendation. The Kyriba rollout assistant is a **$5M budget / $11M promised benefit** pilot still gated on a test-defect corpus and a RACI that hasn't been resolved — a generic answer would never surface that the gap between promise and realization is an execution dependency, not a capability gap. Morgan Street as the shared-services spine means AI standardization has to cross OpCo boundaries without operating-revenue leverage to force adoption. A generic answer would tell you to "align stakeholders." The real answer is that the holdco has no P&L stick — so governance and adoption design have to substitute for it.

The second layer is what I won't do that a generic assistant will: I won't invent a benchmark ("holdcos typically achieve 18% efficiency gains") and present it as your number. I'll name what's missing and why it matters to your specific decision.

What makes that worth paying for is that the wrong framing on the Kyriba pilot alone — treating it as a deployment problem rather than a defect-triage dependency — could mean a September 2026 target date is missed without anyone in leadership understanding why until it's too late to recover.
```
